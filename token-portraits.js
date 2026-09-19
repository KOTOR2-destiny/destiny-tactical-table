// Persistent token portraits: cache signed URLs and decoded images, and restore them
// synchronously in the DOM mutation microtask after app.js redraws tokens.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const bucket='tactical-token-portraits',layer=document.getElementById('tokenLayer'),actions=document.querySelector('.top-actions');
const button=document.createElement('button');button.type='button';button.id='portraitUploadButton';button.className='secondary hidden';button.textContent='SET TOKEN PORTRAIT';
const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp,image/gif';input.hidden=true;input.setAttribute('aria-label','Choose token portrait');
actions?.insertBefore(button,document.getElementById('signOutBtn'));actions?.append(input);
let selected=null,uploading=false,serial=0,refreshTimer=null;
const urls=new Map(),portraits=new Map(); // token ID -> {path,url,loaded}
const isGM=()=>document.getElementById('roleLabel')?.textContent?.trim().toUpperCase()==='GM'&&!document.getElementById('tableView')?.classList.contains('hidden');
const currentIds=()=>new Set([...layer.querySelectorAll('.token[data-id]')].map(el=>el.dataset.id));
function syncButton(){if(selected&&!currentIds().has(selected))selected=null;button.classList.toggle('hidden',!selected||!isGM());button.disabled=uploading;button.textContent=uploading?'UPLOADING…':'SET TOKEN PORTRAIT';}
layer.addEventListener('click',e=>{const token=e.target.closest('.token[data-id]');if(token&&isGM()){selected=token.dataset.id;syncButton();}},true);
button.addEventListener('click',()=>{if(selected&&isGM()&&!uploading)input.click();});
document.getElementById('backLobbyBtn')?.addEventListener('click',()=>{selected=null;syncButton();});
document.getElementById('signOutBtn')?.addEventListener('click',()=>{selected=null;urls.clear();portraits.clear();syncButton();});
function portraitPath(t){const path=t?.state?.portrait_path;return typeof path==='string'&&/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/i.test(path)?path:null;}
async function signed(path){const cached=urls.get(path);if(cached&&cached.expires>Date.now())return cached.url;const {data,error}=await db.storage.from(bucket).createSignedUrl(path,3600);if(error)throw error;urls.set(path,{url:data.signedUrl,expires:Date.now()+3300000});return data.signedUrl;}
function applyPortrait(el,entry){if(!entry?.loaded)return;let img=el.querySelector('.token-portrait');if(!img){img=document.createElement('img');img.className='token-portrait';img.alt='';img.draggable=false;img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;pointer-events:none;';el.insertBefore(img,el.firstChild);}if(img.src!==entry.url)img.src=entry.url;const initials=el.querySelector('.initials');if(initials)initials.style.display='none';}
function restore(){for(const el of layer.querySelectorAll('.token[data-id]'))applyPortrait(el,portraits.get(el.dataset.id));}
async function paint(){const run=++serial,elements=[...layer.querySelectorAll('.token[data-id]')];if(!elements.length)return;const ids=elements.map(el=>el.dataset.id);const {data,error}=await db.from('scene_tokens').select('id,state').in('id',ids);if(error){console.warn('Portrait lookup:',error.message);return;}if(run!==serial)return;const paths=new Map((data||[]).map(t=>[t.id,portraitPath(t)]));for(const id of ids){const path=paths.get(id);if(!path){portraits.delete(id);continue;}if(portraits.get(id)?.path===path&&portraits.get(id)?.loaded)continue;try{const url=await signed(path);if(run!==serial)return;const image=new Image();image.src=url;await new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth)return resolve();image.onload=resolve;image.onerror=()=>reject(Error('Image failed to load'));});if(run!==serial)return;portraits.set(id,{path,url,loaded:true});restore();}catch(e){console.warn('Portrait unavailable:',e.message);}}restore();}
function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{syncButton();paint().catch(console.error);},120);}
// A redraw no longer waits for another database query or signed URL request.
// MutationObserver runs before the browser's next paint, preserving the portrait visually.
new MutationObserver(()=>{restore();schedule();}).observe(layer,{childList:true});
new MutationObserver(syncButton).observe(document.getElementById('roleLabel'),{childList:true,characterData:true,subtree:true});
input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file||!selected||!isGM()||uploading)return;const tokenId=selected;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024){alert('Choose a PNG, JPEG, WebP, or GIF image smaller than 5 MB.');return;}
 uploading=true;syncButton();try{
  const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error('Sign in as GM first.');
  const code=document.getElementById('codeLabel')?.textContent?.trim();if(!code)throw Error('No active session.');
  const {data:sessions,error:sessionError}=await db.from('game_sessions').select('id,campaign_id').eq('join_code',code).eq('is_active',true);if(sessionError)throw sessionError;
  let campaign=null;for(const session of sessions||[]){const {data:member}=await db.from('campaign_members').select('role').eq('campaign_id',session.campaign_id).eq('user_id',user.id).eq('role','gm').maybeSingle();if(member){campaign=session.campaign_id;break;}}
  if(!campaign)throw Error('GM permission required.');
  const {data:token,error:tokenError}=await db.from('scene_tokens').select('id,state,scene_id').eq('id',tokenId).single();if(tokenError)throw tokenError;
  const {data:scene,error:sceneError}=await db.from('scenes').select('session_id').eq('id',token.scene_id).single();if(sceneError)throw sceneError;
  const session=sessions.find(s=>s.id===scene.session_id&&s.campaign_id===campaign);if(!session||!currentIds().has(tokenId))throw Error('Token is not in your active session.');
  const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[file.type];
  const path=`${campaign}/${tokenId}/${crypto.randomUUID()}.${extension}`;
  const {error:uploadError}=await db.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;
  const state={...(token.state||{}),portrait_path:path};
  const {data:updated,error:updateError}=await db.from('scene_tokens').update({state}).eq('id',tokenId).select('id').single();if(updateError||!updated)throw updateError||Error('Portrait update was rejected.');
  portraits.delete(tokenId);schedule();
 }catch(e){console.error('Portrait upload:',e);alert(`Portrait could not be saved: ${e.message}`);}
 finally{uploading=false;syncButton();}
});
schedule();
