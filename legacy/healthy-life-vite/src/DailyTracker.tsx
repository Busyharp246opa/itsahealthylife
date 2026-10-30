import { useState } from 'react';
import { Activity, ChevronDown, Plus, RotateCcw, Trash2, Utensils } from 'lucide-react';
import './DailyTracker.css';

export type TrackedMeal = { id:string; name:string; slot:string; calories:number; protein:number; carbs:number; fat:number };
export type TrackedActivity = { id:string; name:string; minutes:number };
export type NewMeal = Omit<TrackedMeal,'id'>;
export type NewActivity = Omit<TrackedActivity,'id'>;

type Props = {
  meals:TrackedMeal[];
  activities:TrackedActivity[];
  onAddMeal:(entry:NewMeal)=>boolean|Promise<boolean>;
  onAddActivity:(entry:NewActivity)=>boolean|Promise<boolean>;
  onRemoveMeal:(id:string)=>void|Promise<void>;
  onRemoveActivity:(id:string)=>void|Promise<void>;
  busy?:boolean;
};

const mealSlots=['Breakfast','Lunch','Dinner','Snack'];
const initialSlot=()=>{const hour=new Date().getHours();return hour<11?'Breakfast':hour<15?'Lunch':hour<21?'Dinner':'Snack'};
const emptyMeal=(slot=initialSlot())=>({name:'',slot,calories:'',protein:'',carbs:'',fat:''});

export function DailyTracker({meals,activities,onAddMeal,onAddActivity,onRemoveMeal,onRemoveActivity,busy=false}:Props){
  const [mode,setMode]=useState<'meal'|'activity'>('meal');
  const [meal,setMeal]=useState(emptyMeal);
  const [activity,setActivity]=useState({name:'',minutes:''});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const locked=busy||saving;
  const totals=meals.reduce((value,item)=>({calories:value.calories+Number(item.calories),protein:value.protein+Number(item.protein),carbs:value.carbs+Number(item.carbs),fat:value.fat+Number(item.fat)}),{calories:0,protein:0,carbs:0,fat:0});
  const minutes=activities.reduce((value,item)=>value+Number(item.minutes),0);
  const entryCount=meals.length+activities.length;
  const dayLabel=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric'}).format(new Date());
  const addMeal=async(entry:NewMeal)=>{
    setSaving(true);setError('');
    try {const saved=await onAddMeal(entry);if(!saved){setError('Could not save the meal. Please try again.');return false}return true}
    catch(problem){setError(problem instanceof Error?problem.message:'Could not save the meal.');return false}
    finally {setSaving(false)}
  };
  const addActivity=async(entry:NewActivity)=>{
    setSaving(true);setError('');
    try {const saved=await onAddActivity(entry);if(!saved){setError('Could not save the activity. Please try again.');return false}return true}
    catch(problem){setError(problem instanceof Error?problem.message:'Could not save the activity.');return false}
    finally {setSaving(false)}
  };
  return <div className="daily-tracker">
    <div className="daily-track-heading"><div><span className="daily-track-kicker">YOUR DAILY CHECK-IN</span><h1>Track your day</h1><p>A quick note now makes your progress easier to see.</p></div><span className="daily-track-date">{dayLabel}</span></div>
    <div className="daily-track-overview">
      <div className="daily-track-nutrition"><div className="daily-track-summary-label"><Utensils size={16}/><span>Nutrition today</span></div><strong>{totals.calories.toLocaleString()} <small>kcal</small></strong><div className="daily-track-macros"><span>Protein <b>{totals.protein}g</b></span><span>Carbs <b>{totals.carbs}g</b></span><span>Fat <b>{totals.fat}g</b></span></div></div>
      <div className="daily-track-movement"><div className="daily-track-summary-label"><Activity size={17}/><span>Movement today</span></div><strong>{minutes} <small>min</small></strong><p>{activities.length?`${activities.length} ${activities.length===1?'activity':'activities'} logged`:'Every bit of movement counts.'}</p></div>
    </div>
    <div className="daily-track-workspace">
      <section className="daily-track-quick" aria-labelledby="daily-track-quick-title">
        <div className="daily-track-card-head"><div><span className="daily-track-kicker">ONE SMALL STEP</span><h2 id="daily-track-quick-title">Quick add</h2></div><Plus size={22}/></div>
        <div className="daily-track-tabs" role="tablist" aria-label="Entry type"><button type="button" role="tab" aria-selected={mode==='meal'} className={mode==='meal'?'active':''} onClick={()=>{setMode('meal');setError('')}}><Utensils size={16}/> Meal</button><button type="button" role="tab" aria-selected={mode==='activity'} className={mode==='activity'?'active':''} onClick={()=>{setMode('activity');setError('')}}><Activity size={16}/> Activity</button></div>
        {mode==='meal'?<form className="daily-track-form" onSubmit={async event=>{event.preventDefault();if(locked||!meal.name.trim()||meal.calories==='')return;const saved=await addMeal({name:meal.name.trim(),slot:meal.slot,calories:Number(meal.calories),protein:Number(meal.protein||0),carbs:Number(meal.carbs||0),fat:Number(meal.fat||0)});if(saved)setMeal(emptyMeal(meal.slot))}}>
          <label>Food or meal<input autoComplete="off" required maxLength={120} placeholder="e.g. Oatmeal with banana" value={meal.name} onChange={event=>setMeal({...meal,name:event.target.value})}/></label>
          <div className="daily-track-form-pair"><label>Meal<select value={meal.slot} onChange={event=>setMeal({...meal,slot:event.target.value})}>{mealSlots.map(slot=><option key={slot}>{slot}</option>)}</select></label><label>Calories<input type="number" min="0" step="1" required inputMode="numeric" placeholder="kcal" value={meal.calories} onChange={event=>setMeal({...meal,calories:event.target.value})}/></label></div>
          <details className="daily-track-details"><summary>Macros <span>Optional</span><ChevronDown size={15}/></summary><div className="daily-track-macro-fields"><label>Protein (g)<input type="number" min="0" step="0.1" inputMode="decimal" value={meal.protein} onChange={event=>setMeal({...meal,protein:event.target.value})}/></label><label>Carbs (g)<input type="number" min="0" step="0.1" inputMode="decimal" value={meal.carbs} onChange={event=>setMeal({...meal,carbs:event.target.value})}/></label><label>Fat (g)<input type="number" min="0" step="0.1" inputMode="decimal" value={meal.fat} onChange={event=>setMeal({...meal,fat:event.target.value})}/></label></div></details>
          <button className="daily-track-save" disabled={locked}><Plus size={17}/>{saving?'Saving…':'Add meal'}</button>
          <p className="daily-track-form-note">Nutrition values are your estimates.</p>
        </form>:<form className="daily-track-form" onSubmit={async event=>{event.preventDefault();if(locked||!activity.name.trim()||!activity.minutes)return;const saved=await addActivity({name:activity.name.trim(),minutes:Number(activity.minutes)});if(saved)setActivity({name:'',minutes:''})}}>
          <label>Activity<input autoComplete="off" required maxLength={120} placeholder="e.g. Evening walk" value={activity.name} onChange={event=>setActivity({...activity,name:event.target.value})}/></label>
          <label>Minutes<input type="number" min="1" step="1" required inputMode="numeric" placeholder="Time spent moving" value={activity.minutes} onChange={event=>setActivity({...activity,minutes:event.target.value})}/></label>
          <button className="daily-track-save" disabled={locked}><Plus size={17}/>{saving?'Saving…':'Log activity'}</button>
          <p className="daily-track-form-note">Walking, training and recovery all count.</p>
        </form>}
        {error&&<p className="daily-track-error" role="alert">{error}</p>}
      </section>
      <section className="daily-track-log" aria-labelledby="daily-track-log-title">
        <div className="daily-track-card-head"><div><span className="daily-track-kicker">YOUR RECORD</span><h2 id="daily-track-log-title">Today’s log</h2></div><span className="daily-track-count">{entryCount} {entryCount===1?'entry':'entries'}</span></div>
        <div className="daily-track-log-group"><div className="daily-track-group-title"><Utensils size={15}/><h3>Food</h3><span>{meals.length}</span></div>{meals.length?<div className="daily-track-entries">{meals.map(item=><div className="daily-track-entry" key={item.id}><div className="daily-track-entry-main"><strong>{item.name}</strong><small>{item.slot} · {item.calories} kcal · P {item.protein}g · C {item.carbs}g · F {item.fat}g</small></div><div className="daily-track-entry-actions"><button type="button" disabled={locked} title={`Add ${item.name} again`} aria-label={`Add ${item.name} again`} onClick={()=>addMeal({name:item.name,slot:item.slot,calories:item.calories,protein:item.protein,carbs:item.carbs,fat:item.fat})}><RotateCcw size={15}/></button><button type="button" disabled={locked} title={`Remove ${item.name}`} aria-label={`Remove ${item.name}`} onClick={()=>onRemoveMeal(item.id)}><Trash2 size={15}/></button></div></div>)}</div>:<p className="daily-track-empty">No meals added yet.</p>}</div>
        <div className="daily-track-log-group"><div className="daily-track-group-title"><Activity size={15}/><h3>Movement</h3><span>{activities.length}</span></div>{activities.length?<div className="daily-track-entries">{activities.map(item=><div className="daily-track-entry" key={item.id}><div className="daily-track-entry-main"><strong>{item.name}</strong><small>{item.minutes} min</small></div><div className="daily-track-entry-actions"><button type="button" disabled={locked} title={`Log ${item.name} again`} aria-label={`Log ${item.name} again`} onClick={()=>addActivity({name:item.name,minutes:item.minutes})}><RotateCcw size={15}/></button><button type="button" disabled={locked} title={`Remove ${item.name}`} aria-label={`Remove ${item.name}`} onClick={()=>onRemoveActivity(item.id)}><Trash2 size={15}/></button></div></div>)}</div>:<p className="daily-track-empty">No activity logged yet.</p>}</div>
      </section>
    </div>
  </div>
}
