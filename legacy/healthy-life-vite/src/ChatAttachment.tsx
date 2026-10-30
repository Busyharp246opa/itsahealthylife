import { useEffect, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';

export type ChatFile = { name: string; mime: string; size: number; path?: string; dataUrl?: string };
export const attachmentBucket = 'session-attachments';
export const liveAttachmentLimit = 10 * 1024 * 1024;
export const demoAttachmentLimit = 10 * 1024 * 1024;
export const attachmentAccept = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx';
const mimeByExtension: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  pdf: 'application/pdf', txt: 'text/plain', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function attachmentMime(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const expected = mimeByExtension[extension];
  return expected && (!file.type || file.type === expected || (extension === 'jpg' && file.type === 'image/jpeg')) ? expected : null;
}

export function validateAttachment(file: File, limit: number) {
  if (!attachmentMime(file)) return 'Choose a JPG, PNG, WebP, GIF, PDF, text, DOC, or DOCX file.';
  if (file.name.length > 255) return 'Use a file name under 256 characters.';
  if (file.size < 1 || file.size > limit) return `Choose a file up to ${Math.round(limit / 1024 / 1024)} MB.`;
  return null;
}

function demoStore(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('healthy-life-chat-files',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('files');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new Error('Attachment storage is unavailable in this browser.'));
  });
}

export async function saveDemoAttachment(file: File): Promise<ChatFile> {
  const db=await demoStore();
  const path=crypto.randomUUID();
  try { await new Promise<void>((resolve,reject)=>{
    const transaction=db.transaction('files','readwrite');
    transaction.objectStore('files').put(file,path);
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(new Error('Could not save this attachment.'));
  }); } finally { db.close(); }
  return {name:file.name,mime:attachmentMime(file)!,size:file.size,path};
}

export async function loadDemoAttachment(path:string):Promise<Blob> {
  const db=await demoStore();
  try { return await new Promise<Blob>((resolve,reject)=>{
    const request=db.transaction('files','readonly').objectStore('files').get(path);
    request.onsuccess=()=>request.result?resolve(request.result):reject(new Error('Attachment not found.'));
    request.onerror=()=>reject(new Error('Could not load attachment.'));
  }); } finally { db.close(); }
}

export function AttachmentPicker({file,onChange,disabled,limit,error}:{file:File|null;onChange:(file:File|null)=>void;disabled?:boolean;limit:number;error:(message:string)=>void}) {
  const input = useRef<HTMLInputElement>(null);
  return <>
    <input ref={input} className="visually-hidden" type="file" accept={attachmentAccept} aria-label="Choose image or document" tabIndex={-1} onChange={event=>{
      const next = event.target.files?.[0] || null;
      if (next) { const problem = validateAttachment(next,limit); if(problem) {onChange(null);error(problem);} else { error(''); onChange(next); } }
      event.target.value = '';
    }}/>
    <button type="button" className="chat-attach-button" disabled={disabled} aria-label="Attach image or document" title="Attach image or document" onClick={()=>input.current?.click()}><Paperclip size={19}/></button>
    {file&&<div className="chat-selected-file"><span>{file.type.startsWith('image/')?<ImageIcon size={17}/>:<FileText size={17}/>}</span><strong>{file.name}</strong><small>{Math.max(1,Math.round(file.size / 1024))} KB</small><button type="button" onClick={()=>onChange(null)} aria-label={`Remove ${file.name}`}><X size={16}/></button></div>}
  </>;
}

export function MessageAttachment({attachment,download}:{attachment:ChatFile;download?:(path:string)=>Promise<Blob>}) {
  const [url,setUrl] = useState(attachment.dataUrl || '');
  const [error,setError] = useState(false);
  useEffect(()=>{
    if(!attachment.path || !download) return;
    let cancelled=false;
    let objectUrl='';
    setUrl(''); setError(false);
    download(attachment.path).then(blob=>{if(cancelled)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>{if(!cancelled)setError(true)});
    return ()=>{cancelled=true;if(objectUrl)URL.revokeObjectURL(objectUrl)};
  },[attachment.path,attachment.dataUrl,download]);
  const image=attachment.mime.startsWith('image/');
  return <div className="chat-message-file">
    {image&&url&&<a href={url} download={attachment.name} aria-label={`Download ${attachment.name}`}><img src={url} alt={attachment.name}/></a>}
    <div className="chat-file-line">{image?<ImageIcon size={17}/>:<FileText size={17}/>}<span>{url?<a href={url} download={attachment.name}>{attachment.name}</a>:<span>{attachment.name}</span>}<small>{error?'Attachment unavailable':url?'Download attachment':'Loading attachment…'}</small></span></div>
  </div>;
}
