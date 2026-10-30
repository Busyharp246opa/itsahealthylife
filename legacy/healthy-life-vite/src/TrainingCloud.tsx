import type { SupabaseClient, User } from '@supabase/supabase-js';
import { TrainingExpert, TrainingMember, type TrainingLog, type TrainingProgram, type TrainingSession } from './Training';

type Row = Record<string, any>;
type Props = { client: SupabaseClient; user: User; rows:(name:string)=>Row[]; name:(id:string)=>string; act:(operation:()=>Promise<unknown>,success:string)=>Promise<void>; busy:boolean };
const day = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
async function check<T>(promise:PromiseLike<{data:T|null;error:any}>):Promise<T|null>{const result=await promise;if(result.error)throw result.error;return result.data}

export function CloudMemberTraining({client,user,rows,name,act,busy}:Props){
  const programs=rows('training_programs') as TrainingProgram[];
  const logs=rows('training_workout_logs') as TrainingLog[];
  const sessions=rows('training_sessions') as TrainingSession[];
  const bookedExperts=[...new Set(rows('bookings').filter(x=>x.member_id===user.id&&['confirmed','completed'].includes(x.status)).map(x=>x.expert_id))].map(id=>({id,name:name(id)}));
  return <TrainingMember programs={programs} logs={logs} sessions={sessions} bookedExperts={bookedExperts} busy={busy}
    onCreate={(programName,active,id)=>{void act(()=>check(client.from('training_programs').insert({id,member_id:user.id,name:programName,active,schedule:{}})),'Program created')}}
    onUpdate={(program,patch)=>{void act(()=>check(client.from('training_programs').update(patch).eq('id',program.id).eq('member_id',user.id)),'Program saved')}}
    onActivate={program=>{void act(()=>check(client.rpc('activate_training_program',{p_program_id:program.id})),'Active program changed')}}
    onDelete={program=>{void act(async()=>{if(program.active&&programs.length>1)throw Error('Activate another program before deleting this one.');await check(client.from('training_programs').delete().eq('id',program.id).eq('member_id',user.id))},'Program deleted')}}
    onSaveLog={(program,item,set,reps,weight,existing)=>{void act(()=>check(existing?client.from('training_workout_logs').update({reps,weight_kg:weight}).eq('id',existing.id).eq('member_id',user.id):client.from('training_workout_logs').insert({program_id:program.id,member_id:user.id,workout_date:day(),exercise_instance_id:item.id,exercise_name:item.name,set_number:set,reps,weight_kg:weight})),'Set logged')}}
    onDeleteLog={log=>{void act(()=>check(client.from('training_workout_logs').delete().eq('id',log.id).eq('member_id',user.id)),'Set cleared')}}
    onComplete={(program,completed,existing)=>{void act(()=>check(existing?client.from('training_sessions').update({completed_at:completed?new Date().toISOString():null}).eq('id',existing.id).eq('member_id',user.id):client.from('training_sessions').insert({program_id:program.id,member_id:user.id,workout_date:day(),completed_at:completed?new Date().toISOString():null})) ,completed?'Session completed':'Session reopened')}}/>;
}

export function CloudExpertTraining({rows,name}:Pick<Props,'rows'|'name'>){
  const programs=rows('training_programs') as TrainingProgram[];
  return <TrainingExpert programs={programs} logs={rows('training_workout_logs') as TrainingLog[]} sessions={rows('training_sessions') as TrainingSession[]} name={name}/>;
}
