import { useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, MessageCircle, ShieldAlert, UsersRound } from 'lucide-react';

export type CircleRoom = { id: string; name: string; topic: string; description: string; accent: string };
export type CircleComment = { id: string; author: string; body: string; createdAt?: string };
export type CirclePost = { id: string; authorId: string; author: string; roomId?: string | null; kind: string; title: string; body: string; createdAt: string; likes: number; liked: boolean; comments: CircleComment[]; reported?: boolean };
export type CircleActions = {
  create: (post: { title: string; body: string; kind: string; roomId: string | null }) => void;
  like: (post: CirclePost) => void;
  comment: (post: CirclePost, body: string) => void;
  report: (post: CirclePost, reason: string) => void;
  block: (post: CirclePost) => void;
  unblock: (authorId: string) => void;
  remove: (post: CirclePost) => void;
};
const kinds = [['update','Update'],['question','Question'],['milestone','Milestone'],['coach_tip','Coach tip']] as const;
const initials = (name: string) => name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();

export function Circle({ space, viewerId, viewerName, posts, rooms, blocked, guidelines, actions, busy=false }: {
  space: 'member'|'expert'; viewerId: string; viewerName: string; posts: CirclePost[]; rooms: CircleRoom[];
  blocked: { id:string; name:string }[]; guidelines: string; actions: CircleActions; busy?: boolean;
}) {
  const [room,setRoom] = useState<string|null>(null);
  const [person,setPerson] = useState<string|null>(null);
  const [kind,setKind] = useState('update');
  const [postRoom,setPostRoom] = useState('');
  const [title,setTitle] = useState('');
  const [body,setBody] = useState('');
  const [comments,setComments] = useState<Record<string,string>>({});
  const roomRecord=rooms.find(x=>x.id===room);
  const personName=posts.find(x=>x.authorId===person)?.author;
  const visible=posts.filter(x=>(!room || x.roomId===room)&&(!person || x.authorId===person)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const people=[...new Map(posts.filter(x=>x.authorId!==viewerId).map(x=>[x.authorId,{id:x.authorId,name:x.author}])).values()].slice(0,5);
  const isExpert=space==='expert';
  return <div className="circle-page">
    <div className="circle-hero">
      {(roomRecord||person) && <button className="circle-back" onClick={()=>{setRoom(null);setPerson(null);setPostRoom('')}}><ArrowLeft size={17}/> Back to Circle</button>}
      <span className="circle-eyebrow">{isExpert?'EXPERT CIRCLE':roomRecord?.topic.toUpperCase()||'MEMBER CIRCLE'}</span>
      <h1>{personName||roomRecord?.name || (isExpert?'Connect with other experts.':'Share the work together.')}</h1>
      <p>{person?'Posts shared in this Circle.':roomRecord?.description || (isExpert?'Share coaching notes and questions with approved experts.':'Post updates, ask questions, and cheer each other on.')}</p>
      <a href="#circle-compose" className="btn primary">Create a post <ArrowRight size={16}/></a>
    </div>
    {!isExpert && !room && !person && <section className="circle-rooms" aria-label="Find a room"><div className="section-title"><h2>Find a room</h2><span>Spaces for the habits you’re building</span></div><div className="circle-room-grid">{rooms.map(x=><button className={`circle-room-card circle-${x.accent}`} key={x.id} onClick={()=>{setRoom(x.id);setPostRoom(x.id);window.scrollTo({top:0,behavior:'smooth'})}}><span><UsersRound size={17}/> {x.topic}</span><strong>{x.name}</strong><small>{x.description}</small><em>{posts.filter(p=>p.roomId===x.id).length} {posts.filter(p=>p.roomId===x.id).length===1?'post':'posts'} <ArrowRight size={16}/></em></button>)}</div></section>}
    <div className="circle-layout"><section className="circle-feed" aria-label="Circle posts"><div className="section-title"><h2>{personName?`${personName}'s posts`:roomRecord?`${roomRecord.name} posts`:isExpert?'Expert posts':'Member posts'}</h2><span>Newest first · {visible.length} {visible.length===1?'post':'posts'}</span></div>
      {visible.length===0 && <div className="card circle-empty"><h3>No posts here yet</h3><p>Start the conversation with an update or question.</p><a className="btn soft" href="#circle-compose">Create the first post</a></div>}
      {visible.map(post=><article className="card circle-post" key={post.id}>
        <div className="circle-post-top"><div className="circle-person"><span className="circle-avatar">{initials(post.author)}</span><div><button className="circle-name-button" onClick={()=>{setPerson(post.authorId);setRoom(null);window.scrollTo({top:0,behavior:'smooth'})}}>{post.author}</button><small>{rooms.find(x=>x.id===post.roomId)?.name|| (isExpert?'Expert Circle':'Member Circle')}</small></div></div><span className="badge lavender">{kinds.find(x=>x[0]===post.kind)?.[1]||'Update'}</span></div>
        <h3>{post.title}</h3><p>{post.body}</p>
        <div className="circle-post-actions"><button type="button" aria-pressed={post.liked} onClick={()=>actions.like(post)} disabled={busy}><Heart size={17} fill={post.liked?'currentColor':'none'}/> {post.liked?'Liked':'Like'} · {post.likes}</button><span><MessageCircle size={17}/> {post.comments.length} {post.comments.length===1?'comment':'comments'}</span><time>{new Intl.DateTimeFormat('en-AE',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(post.createdAt))}</time></div>
        <div className="circle-comments">{post.comments.map(c=><div className="circle-comment" key={c.id}><span className="circle-avatar small">{initials(c.author)}</span><div><strong>{c.author}</strong><p>{c.body}</p></div></div>)}<form onSubmit={e=>{e.preventDefault();const value=comments[post.id]?.trim();if(!value)return;actions.comment(post,value);setComments(x=>({...x,[post.id]:''}))}}><label className="sr-only" htmlFor={`circle-comment-${post.id}`}>Write a comment on {post.title}</label><textarea id={`circle-comment-${post.id}`} value={comments[post.id]||''} maxLength={2000} required rows={2} placeholder="Write a comment…" onChange={e=>setComments(x=>({...x,[post.id]:e.target.value}))}/><button className="btn soft" disabled={busy}>Comment</button></form></div>
        {post.authorId===viewerId?<button className="circle-remove" onClick={()=>actions.remove(post)} disabled={busy}>Delete post</button>:<details className="circle-safety"><summary><ShieldAlert size={15}/> Safety options</summary><div><label>Reason for report<select id={`report-${post.id}`} defaultValue="Unkind or unsafe content"><option>Unkind or unsafe content</option><option>Spam</option><option>Privacy concern</option><option>Misleading health advice</option></select></label><button className="btn soft" disabled={busy||post.reported} onClick={()=>{const select=document.getElementById(`report-${post.id}`) as HTMLSelectElement;actions.report(post,select.value)}}>{post.reported?'Report sent':'Report post'}</button><button className="btn ghost" disabled={busy} onClick={()=>{actions.block(post);setPerson(null)}}>Block {post.author}</button></div></details>}
      </article>)}
    </section><aside className="circle-aside"><section className="card circle-compose" id="circle-compose"><span className="circle-eyebrow">YOUR VOICE</span><h2>Create a post</h2><p>{isExpert?'Visible to approved experts only.':'Share an update or question with members.'}</p><form onSubmit={e=>{e.preventDefault();if(!title.trim()||!body.trim())return;actions.create({title:title.trim(),body:body.trim(),kind,roomId:isExpert?null:(room||postRoom||null)});setTitle('');setBody('')}}>
      {!isExpert && <label>Room<select value={room||postRoom} onChange={e=>setPostRoom(e.target.value)} disabled={!!room}><option value="">Full Circle</option>{rooms.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
      <label>Post type<select value={kind} onChange={e=>setKind(e.target.value)}>{kinds.filter(x=>isExpert||x[0]!=='coach_tip').map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label>
      <label>Title<input value={title} required maxLength={120} placeholder="What’s on your mind?" onChange={e=>setTitle(e.target.value)}/></label><label>Your post<textarea value={body} required maxLength={5000} rows={5} placeholder="Share a thought, question, or win…" onChange={e=>setBody(e.target.value)}/></label><button className="btn primary full" disabled={busy}>Publish post</button></form></section>
      <section className="card circle-side-card"><h3>{isExpert?'Experts to know':'Members to know'}</h3>{people.length?people.map(p=><button className="circle-person circle-person-link" key={p.id} onClick={()=>{setPerson(p.id);setRoom(null);window.scrollTo({top:0,behavior:'smooth'})}}><span className="circle-avatar small">{initials(p.name)}</span><span><strong>{p.name}</strong><small>{isExpert?'Expert':'Member'}</small></span></button>):<p>People who post here will appear here.</p>}</section>
      <section className="card circle-side-card"><h3>Community guidelines</h3><p>{guidelines}</p></section>
      {!!blocked.length&&<section className="card circle-side-card"><h3>Blocked people</h3>{blocked.map(x=><div className="circle-block-row" key={x.id}><span>{x.name}</span><button className="btn ghost" onClick={()=>actions.unblock(x.id)}>Unblock</button></div>)}</section>}
    </aside></div>
  </div>;
}
