import { TrainingExpert, TrainingMember, type TrainingLog, type TrainingSession } from './Training';
import { expertId, memberId, uid, type AppData } from './data';

type Props = { data: AppData; change: (fn:(draft:AppData)=>void,action?:string)=>void; toast:(message:string)=>void };
const day = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

export function DemoMemberTraining({data,change,toast}:Props) {
  const bookedExperts = data.experts.filter(expert=>data.bookings.some(booking=>booking.memberId===memberId&&booking.expertId===expert.id&&['confirmed','completed'].includes(booking.status))).map(expert=>({id:expert.id,name:expert.name}));
  return <TrainingMember programs={data.trainingPrograms} logs={data.trainingLogs} sessions={data.trainingSessions} bookedExperts={bookedExperts}
    onCreate={(name,active,id)=>{change(d=>d.trainingPrograms.push({id,member_id:memberId,name,active,shared_expert_id:null,schedule:{},created_at:new Date().toISOString()}),'Member created training program');toast('Program created')}}
    onUpdate={(program,patch)=>{if(patch.shared_expert_id&&!bookedExperts.some(x=>x.id===patch.shared_expert_id)){toast('Book this expert before sharing');return}change(d=>Object.assign(d.trainingPrograms.find(x=>x.id===program.id)!,patch),'Member updated training program');toast('Program saved')}}
    onActivate={program=>{change(d=>d.trainingPrograms.forEach(x=>{x.active=x.id===program.id}),'Member activated training program');toast('Active program changed')}}
    onDelete={program=>{change(d=>{d.trainingPrograms=d.trainingPrograms.filter(x=>x.id!==program.id);d.trainingLogs=d.trainingLogs.filter(x=>x.program_id!==program.id);d.trainingSessions=d.trainingSessions.filter(x=>x.program_id!==program.id);if(!d.trainingPrograms.some(x=>x.active)&&d.trainingPrograms[0])d.trainingPrograms[0].active=true},'Member deleted training program');toast('Program deleted')}}
    onSaveLog={(program,item,set,reps,weight,existing)=>{change(d=>{const record:TrainingLog={id:existing?.id||uid(),program_id:program.id,member_id:memberId,workout_date:day(),exercise_instance_id:item.id,exercise_name:item.name,set_number:set,reps,weight_kg:weight};if(existing)Object.assign(d.trainingLogs.find(x=>x.id===existing.id)!,record);else d.trainingLogs.push(record)},'Member logged training set');toast('Set logged')}}
    onDeleteLog={log=>{change(d=>{d.trainingLogs=d.trainingLogs.filter(x=>x.id!==log.id)},'Member cleared training set');toast('Set cleared')}}
    onComplete={(program,completed,existing)=>{change(d=>{const record:TrainingSession={id:existing?.id||uid(),program_id:program.id,member_id:memberId,workout_date:day(),completed_at:completed?new Date().toISOString():null};if(existing)Object.assign(d.trainingSessions.find(x=>x.id===existing.id)!,record);else d.trainingSessions.push(record)},'Member updated training session');toast(completed?'Session completed':'Session reopened')}}/>;
}

export function DemoExpertTraining({data}:Pick<Props,'data'>) {
  const booked=data.bookings.some(b=>b.memberId===memberId&&b.expertId===expertId&&['confirmed','completed'].includes(b.status));
  const programs=booked?data.trainingPrograms.filter(p=>p.shared_expert_id===expertId):[];
  return <TrainingExpert programs={programs} logs={data.trainingLogs.filter(x=>programs.some(p=>p.id===x.program_id))} sessions={data.trainingSessions.filter(x=>programs.some(p=>p.id===x.program_id))} name={()=>data.profile.name}/>;
}
