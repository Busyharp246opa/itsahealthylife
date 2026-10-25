import { useEffect, useRef, useState } from 'react';
import { Dumbbell, Pause, Play } from 'lucide-react';

export type ExerciseAnimation = { frames: string[]; sequence: number[]; frameDurationMs: number };
const source = (frame: string) => `/data/flow/${frame}`;

export function ExercisePreview({ name, animation, compact=false }: { name: string; animation?: ExerciseAnimation | null; compact?: boolean }) {
  const root=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [position,setPosition]=useState(0);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hidden,setHidden]=useState(document.hidden);
  const [override,setOverride]=useState<boolean|null>(null);
  const playing=override??!reduced;
  const frames=animation?.frames;
  const sequence=animation?.sequence;
  const duration=animation?.frameDurationMs;

  useEffect(()=>{
    if (!animation) return;
    const node=root.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer=new IntersectionObserver(entries=>setVisible(Boolean(entries[0]?.isIntersecting)),{rootMargin:'120px'});
    observer.observe(node);
    return ()=>observer.disconnect();
  },[animation]);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange=()=>setReduced(query.matches);
    query.addEventListener('change',onChange);
    const onVisibility=()=>setHidden(document.hidden);
    document.addEventListener('visibilitychange',onVisibility);
    return ()=>{query.removeEventListener('change',onChange);document.removeEventListener('visibilitychange',onVisibility)};
  },[]);
  useEffect(()=>{
    if (!frames || !visible) return;
    let active=true;
    Promise.all(frames.map(frame=>new Promise<boolean>(resolve=>{
      const image=new Image();
      image.onload=()=>resolve(true);
      image.onerror=()=>resolve(false);
      image.src=source(frame);
    }))).then(results=>{if(active){setReady(results.every(Boolean));setFailed(results.some(ok=>!ok))}});
    return ()=>{active=false};
  },[frames,visible]);
  useEffect(()=>{
    if (!ready || !visible || !playing || hidden || !sequence || !duration) return;
    const timer=window.setInterval(()=>setPosition(index=>(index+1)%sequence.length),duration);
    return ()=>window.clearInterval(timer);
  },[ready,visible,playing,hidden,sequence,duration]);

  if (!animation) return <div className={`flow-preview flow-preview-empty ${compact?'compact':''}`} role="img" aria-label={`No animation available for ${name}`}><Dumbbell size={compact?25:44}/><span>Instructions only</span></div>;
  const frame=frames?.[sequence?.[position]??0] || frames?.[0];
  return <div ref={root} className={`flow-preview ${compact?'compact':''}`}>
    {failed?<div className="flow-preview-fallback"><Dumbbell size={compact?25:44}/><span>Preview unavailable</span></div>:<img src={source(frame!)} alt={`Illustrative movement preview of ${name}`} loading={compact?'lazy':'eager'} decoding="async"/>}
    <div className="flow-preview-overlay"><span>{compact?'ILLUSTRATIVE':'Illustrative preview · motion is not exercise tempo'}</span><button type="button" aria-label={`${playing?'Pause':'Play'} preview of ${name}`} aria-pressed={playing} onClick={()=>setOverride(!playing)} disabled={failed}>{playing?<Pause size={compact?13:16}/>:<Play size={compact?13:16}/>}<span>{playing?'Pause':'Play'}</span></button></div>
  </div>;
}
