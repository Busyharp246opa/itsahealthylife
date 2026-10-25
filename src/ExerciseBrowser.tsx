import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Search } from 'lucide-react';
import { ExercisePreview, type ExerciseAnimation } from './ExercisePreview';
import { backTo, pushLocation, readLocation, replaceLocation, scrollToPageTop } from './navigation';

export type CatalogExercise = { id:string; name:string; category:string; equipment:string; target:string; instructions:string; steps:string[]; animation?:ExerciseAnimation|null };
const clean = (value:string) => value.trim().toLowerCase();
const unique = (items:string[]) => [...new Set(items.filter(Boolean))].sort((a,b)=>a.localeCompare(b));

export function ExerciseBrowser({catalog,programName,day,busy,onBack,onAdd}:{catalog:CatalogExercise[];programName:string;day:string;busy?:boolean;onBack:()=>void;onAdd:(exercise:CatalogExercise,sets:number,reps:number,notes:string)=>void}) {
  const [view,setView]=useState<'home'|'results'|'detail'>(()=>readLocation()?.training?.browserView||'home');
  const [query,setQuery]=useState(()=>readLocation()?.training?.filters?.query||'');
  const [category,setCategory]=useState(()=>readLocation()?.training?.filters?.category||'All');
  const [equipment,setEquipment]=useState(()=>readLocation()?.training?.filters?.equipment||'All');
  const [target,setTarget]=useState(()=>readLocation()?.training?.filters?.target||'All');
  const [page,setPage]=useState(()=>readLocation()?.training?.filters?.page||0);
  const [selectedId,setSelectedId]=useState(()=>readLocation()?.training?.exerciseId||'');
  const [sets,setSets]=useState(3);
  const [reps,setReps]=useState(10);
  const [notes,setNotes]=useState('');
  const categories=useMemo(()=>unique(catalog.map(x=>x.category)),[catalog]);
  const equipmentList=useMemo(()=>unique(catalog.map(x=>x.equipment)),[catalog]);
  const targets=useMemo(()=>unique(catalog.map(x=>x.target)),[catalog]);
  const results=useMemo(()=>catalog.filter(x=>(category==='All'||x.category===category)&&(equipment==='All'||x.equipment===equipment)&&(target==='All'||x.target===target)&&`${x.name} ${x.target} ${x.equipment}`.toLowerCase().includes(clean(query))),[catalog,category,equipment,target,query]);
  const selected=catalog.find(x=>x.id===selectedId)||null;
  const pages=Math.max(1,Math.ceil(results.length/20));
  const currentPage=Math.min(page,pages-1);
  useEffect(()=>{const restore=()=>{const training=readLocation()?.training;if(training?.view==='browse'){setView(training.browserView||'home');setSelectedId(training.exerciseId||'');setQuery(training.filters?.query||'');setCategory(training.filters?.category||'All');setEquipment(training.filters?.equipment||'All');setTarget(training.filters?.target||'All');setPage(training.filters?.page||0);scrollToPageTop()}};window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore)},[]);
  useEffect(()=>{const current=readLocation();if(current?.training?.view==='browse')replaceLocation({mode:current.mode,role:current.role,page:'train',training:{...current.training,filters:{query,category,equipment,target,page}}})},[query,category,equipment,target,page]);
  const route=(next:'home'|'results'|'detail',exerciseId?:string)=>{const current=readLocation();if(current){pushLocation({mode:current.mode,role:current.role,page:'train',training:{...current.training!,view:'browse',browserView:next,filters:{query,category,equipment,target,page},...(exerciseId?{exerciseId}:{})}})}setView(next);if(exerciseId)setSelectedId(exerciseId);scrollToPageTop()};
  const showResults=()=>{setPage(0);route('results')};
  const back=()=>{
    if(view==='home'){onBack();return}
    const previous=view==='detail'?'results':'home';
    backTo(parent=>parent.page==='train'&&parent.training?.view==='browse'&&parent.training.browserView===previous,()=>{const current=readLocation();if(current)replaceLocation({mode:current.mode,role:current.role,page:'train',training:{...current.training!,view:'browse',browserView:previous}});setView(previous);scrollToPageTop()});
  };
  return <div className="training-app exercise-browser">
    <div className="training-browser-back-row"><button type="button" className="training-browser-back" onClick={back}><ArrowLeft size={16}/> Back to {view==='detail'?'exercise results':view==='results'?'browse exercises':`${programName} · ${day}`}</button></div>
    {view==='home'&&<>
      <section className="exercise-browser-hero"><div><span className="training-overline">EXERCISE LIBRARY · {day.toUpperCase()}</span><h1>Browse exercises</h1><p>{catalog.length.toLocaleString()} movements with muscle, equipment and technique details. Choose one for {programName}.</p></div><form onSubmit={e=>{e.preventDefault();setCategory('All');setEquipment('All');setTarget('All');showResults()}}><label>Search by exercise name<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. barbell squat"/></label><button className="btn primary"><Search size={16}/> Search exercises</button></form></section>
      <div className="exercise-category-grid">{categories.map(x=><button key={x} onClick={()=>{setCategory(x);setEquipment('All');setTarget('All');setQuery('');showResults()}}><span>{x}</span><strong>{catalog.filter(item=>item.category===x).length}</strong></button>)}</div>
      <button className="btn soft" onClick={()=>{setCategory('All');setEquipment('All');setTarget('All');setQuery('');showResults()}}>Browse all exercises <ArrowRight size={15}/></button>
    </>}
    {view==='results'&&<>
      <div className="page-heading"><span className="training-overline">{programName.toUpperCase()} · {day.toUpperCase()}</span><h1>Exercise catalog</h1><p>Filter the library, open a movement, then add it to this day.</p></div>
      <form className="exercise-filter-bar" onSubmit={e=>{e.preventDefault();setPage(0)}}><label>Exercise name<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}} placeholder="e.g. dumbbell curl"/></label><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);setPage(0)}}><option value="All">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Equipment<select value={equipment} onChange={e=>{setEquipment(e.target.value);setPage(0)}}><option value="All">All equipment</option>{equipmentList.map(x=><option key={x}>{x}</option>)}</select></label><label>Target muscle<select value={target} onChange={e=>{setTarget(e.target.value);setPage(0)}}><option value="All">All targets</option>{targets.map(x=><option key={x}>{x}</option>)}</select></label><button className="btn primary">Apply filters</button><button type="button" className="btn soft" onClick={()=>{setQuery('');setCategory('All');setEquipment('All');setTarget('All');setPage(0)}}>Clear</button></form>
      <div className="exercise-results-summary"><strong>{results.length.toLocaleString()} results</strong><span>Page {currentPage+1} of {pages}</span></div>
      <div className="exercise-results-grid">{results.slice(currentPage*20,currentPage*20+20).map(x=><article key={x.id} className="exercise-result-card"><ExercisePreview name={x.name} animation={x.animation} compact/><button type="button" className="exercise-result-copy" onClick={()=>route('detail',x.id)} aria-label={`View ${x.name}`}><small>{x.category}</small><strong>{x.name}</strong><span>{x.target} · {x.equipment}</span><em>View movement <ChevronRight size={14}/></em></button></article>)}</div>
      {!results.length&&<div className="training-empty">No exercises match these filters. Try a shorter name or clear a filter.</div>}
      <div className="exercise-pagination"><button className="btn soft" disabled={currentPage===0} onClick={()=>{setPage(currentPage-1);window.scrollTo(0,0)}}>← Previous</button><span>{currentPage+1} / {pages}</span><button className="btn soft" disabled={currentPage>=pages-1} onClick={()=>{setPage(currentPage+1);window.scrollTo(0,0)}}>Next →</button></div>
    </>}
    {view==='detail'&&selected&&<>
      <section className="exercise-detail-hero"><span className="training-overline">{selected.category.toUpperCase()} · EXERCISE {selected.id}</span><h1>{selected.name}</h1><p>{selected.instructions}</p></section>
      <div className="exercise-detail-grid"><section className="training-panel exercise-profile"><h2>Movement profile</h2><dl><div><dt>Target muscle</dt><dd>{selected.target}</dd></div><div><dt>Equipment</dt><dd>{selected.equipment}</dd></div><div><dt>Category</dt><dd>{selected.category}</dd></div></dl><ExercisePreview name={selected.name} animation={selected.animation}/></section><section className="training-panel exercise-steps"><h2>Technique sequence</h2>{selected.steps?.length?<ol>{selected.steps.map((step,i)=><li key={i}><strong>{String(i+1).padStart(2,'0')}</strong><span>{step}</span></li>)}</ol>:<p>{selected.instructions}</p>}</section></div>
      <form className="training-panel exercise-add-form" onSubmit={e=>{e.preventDefault();if(Number.isInteger(sets)&&sets>=1&&sets<=30&&Number.isInteger(reps)&&reps>=1&&reps<=1000)onAdd(selected,sets,reps,notes)}}><div><span className="training-overline">ADD TO {day.toUpperCase()}</span><h2>Set your target</h2><p>You can edit these targets later in your program.</p></div><label>Sets<input type="number" min="1" max="30" value={sets} onChange={e=>setSets(Number(e.target.value))}/></label><label>Target reps<input type="number" min="1" max="1000" value={reps} onChange={e=>setReps(Number(e.target.value))}/></label><label>Notes<input maxLength={160} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional cue"/></label><button className="btn primary" disabled={busy}>Add to {day} <ArrowRight size={15}/></button></form>
      <button className="training-browser-bottom-back" onClick={back}><ArrowLeft size={16}/> Back to exercise results</button>
    </>}
    <p className="training-attribution">Exercise text: Hasan Emir Yıldırım / exercises-dataset (MIT). Illustrative SVG artwork: Flow Exercise Dataset (CC0-1.0 dedication; see provenance notice).</p>
  </div>;
}
