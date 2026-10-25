import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

type Role = 'member'|'expert'|'admin';
type Entry = { title:string; description:string; keywords:string; demo:string; live?:string };
const entries:Record<Role,Entry[]>={
  member:[
    {title:'Home',description:'Your daily overview',keywords:'today dashboard',demo:'home'},
    {title:'My plan',description:'Bookings, learning and your next step',keywords:'schedule calendar',demo:'plan'},
    {title:'Training programs',description:'Build a weekly program and log sets',keywords:'workout exercise reps train gym',demo:'train'},
    {title:'Exercise library',description:'Open a program to browse movements',keywords:'search browse exercise muscle equipment catalog training',demo:'train'},
    {title:'Food and activity log',description:'Record meals, macros and movement',keywords:'track nutrition calories protein',demo:'track'},
    {title:'Find an expert',description:'Book a coaching session',keywords:'coach trainer specialist booking',demo:'experts'},
    {title:'My bookings',description:'See sessions and appointments',keywords:'calendar schedule',demo:'calendar',live:'plan'},
    {title:'Learning library',description:'Recipes, plans and articles',keywords:'content learn',demo:'library'},
    {title:'Challenge',description:'Progress at your pace',keywords:'goal streak',demo:'challenge'},
    {title:'Circle',description:'Rooms, posts and conversations',keywords:'community post social room comment like',demo:'community'},
    {title:'Shop',description:'Browse wellness products',keywords:'store buy',demo:'shop'},
    {title:'Profile',description:'Your account and preferences',keywords:'settings privacy',demo:'profile'},
  ],
  expert:[
    {title:'Overview',description:'Your workspace summary',keywords:'home dashboard',demo:'home'},
    {title:'My clients',description:'Review your member roster',keywords:'people members',demo:'clients',live:'bookings'},
    {title:'Shared training',description:'Review programs shared by booked members',keywords:'exercise workout reps program',demo:'shared-training'},
    {title:'Expert Circle',description:'Connect with approved experts',keywords:'community post social coach',demo:'community'},
    {title:'Calendar and availability',description:'Plan sessions and open slots',keywords:'schedule booking appointment',demo:'calendar',live:'availability'},
    {title:'Bookings',description:'Your scheduled sessions',keywords:'appointments calendar',demo:'calendar',live:'bookings'},
    {title:'Messages',description:'Conversations with members',keywords:'chat inbox',demo:'messages'},
    {title:'My content',description:'Articles and learning material',keywords:'publish library',demo:'content'},
    {title:'Earnings',description:'Payments and payouts',keywords:'income',demo:'earnings',live:'bookings'},
    {title:'My profile',description:'Edit your expert details',keywords:'account credentials',demo:'expert-profile'},
  ],
  admin:[
    {title:'Platform overview',description:'Operational summary',keywords:'home dashboard',demo:'home'},
    {title:'People',description:'Member accounts and roles',keywords:'users members',demo:'people'},
    {title:'Experts',description:'Review expert applications',keywords:'trainer approval',demo:'experts'},
    {title:'Bookings',description:'Session operations',keywords:'appointments schedule',demo:'bookings'},
    {title:'Payments',description:'Transactions and payouts',keywords:'billing finance',demo:'payments'},
    {title:'Content',description:'Publishing and library',keywords:'articles',demo:'content'},
    {title:'Challenges',description:'Activity goals',keywords:'competition',demo:'challenges'},
    {title:'Store',description:'Products and orders',keywords:'shop inventory',demo:'store-admin',live:'products'},
    {title:'Support',description:'Tickets and reports',keywords:'help moderation',demo:'support'},
    {title:'Settings',description:'Platform policy',keywords:'configuration',demo:'settings'},
  ]
};
const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function FeatureSearch({role,mode,onNavigate}:{role:Role;mode:'demo'|'live';onNavigate:(page:string)=>void}) {
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [active,setActive]=useState(0);
  const input=useRef<HTMLInputElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const close=()=>{setOpen(false);setQuery('');setActive(0);requestAnimationFrame(()=>trigger.current?.focus())};
  const choose=(entry:Entry)=>{onNavigate(mode==='live'?(entry.live||entry.demo):entry.demo);close()};
  const results=useMemo(()=>{const terms=normalize(query).split(' ').filter(Boolean);if(!terms.length)return entries[role].slice(0,7);return entries[role].map((entry,index)=>{const title=normalize(entry.title),all=normalize(`${entry.title} ${entry.description} ${entry.keywords}`);if(!terms.every(term=>all.includes(term)))return null;let score=title===terms.join(' ')?100:title.startsWith(terms.join(' '))?60:0;for(const term of terms)score+=title.includes(term)?20:5;return {entry,index,score}}).filter((x):x is {entry:Entry;index:number;score:number}=>Boolean(x)).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,12).map(x=>x.entry)},[query,role]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(value=>!value)}else if(event.key==='Escape'&&open){event.preventDefault();close()}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[open]);
  useEffect(()=>{if(open)requestAnimationFrame(()=>input.current?.focus())},[open]);
  useEffect(()=>{setOpen(false);setQuery('');setActive(0)},[role]);
  return <><button ref={trigger} className="feature-search-trigger" type="button" onClick={()=>setOpen(true)} aria-label="Find a feature"><Search size={17}/><span>Find a feature</span><kbd>⌘ K</kbd></button>{open&&<div className="feature-search-layer" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="feature-search-panel" role="dialog" aria-modal="true" aria-label="Find a feature"><div className="feature-search-input"><Search size={20}/><input ref={input} role="combobox" aria-label="Search features" aria-expanded="true" aria-controls="feature-search-results" aria-activedescendant={results.length?`feature-result-${active}`:undefined} value={query} onChange={e=>{setQuery(e.target.value);setActive(0)}} onKeyDown={e=>{if(e.key==='ArrowDown'&&results.length){e.preventDefault();setActive((active+1)%results.length)}if(e.key==='ArrowUp'&&results.length){e.preventDefault();setActive((active-1+results.length)%results.length)}if(e.key==='Enter'&&results[active]){e.preventDefault();choose(results[active])}}} placeholder="Search features, e.g. training, booking…"/><button type="button" onClick={close} aria-label="Close search"><X size={18}/></button></div><div className="feature-search-results" id="feature-search-results" role="listbox"><span className="feature-search-heading">{query?`${results.length} matching features`:`Suggested for ${role}s`}</span>{results.map((item,index)=><button type="button" role="option" aria-selected={index===active} id={`feature-result-${index}`} className={index===active?'active':''} key={`${item.title}-${index}`} onMouseEnter={()=>setActive(index)} onClick={()=>choose(item)}><span className="feature-search-result-icon"><Search size={15}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRight size={16}/></button>)}{!results.length&&<p>No matching feature. Try “exercise”, “meal”, or “booking”.</p>}</div><div className="feature-search-hint">↑ ↓ to choose · Enter to open · Esc to close</div></section></div>}</>;
}
