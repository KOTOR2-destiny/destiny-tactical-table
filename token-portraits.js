// Portraits are stored in a private campaign-scoped Supabase Storage bucket.
// Only GMs may upload; signed URLs let authenticated campaign members view artwork.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const bucket='tactical-token-portraits';
const layer=document.getElementById('tokenLayer');
const actions=document.querySelector('.top-actions');
const button=document.createElement('button');button.type='button';button.id='portraitUploadButton';button.className='secondary hidden';button.textContent='SET TOKEN PORTRAIT';
const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp,image/gif';input.hidden=true;input.setAttribute('aria-label','Choose token portrait');
actions?.insertBefore(button,document.getElementById('signOutBtn'));actions?.append(input);
let selected=null,uploading=false,renderSerial=0;
const urls=new Map(); // storage path -> {url, expires}; signed URLs never enter token state
const isGM=()=>document.getElementById('roleLabel')?.textContent?.trim().toUpperCase()==='GM'&&!document.getElementById('tableView')?.classList.contains('hidden');
const currentIds=()=>new Set([...layer.querySelectorAll('.token[data-id]')].map(el=>el.dataset.id));
function syncButton(){if(selected&&!currentIds().has(selected))selected=null;button.classList.toggle('hidden',!selected||!isGM());button.disabled=uploading;button.textContent=uploading?'UPLOADING…':'SET TOKEN PORTRAIT';}
layer.addEventListener('click',e=>{const token=e.target.closest('.token[data-id]');if(token&&isGM()){selected=token.dataset.id;syncButton();}},true);
button.addEventListener('click',()=>{if(selected&&isGM()&&!uploading)input.click();});
document.getElementById('backLobbyBtn')?.addEventListener('click',()=>{selected=null;syncButton();});
document.getElementById('signOutBtn')?.addEventListener('click',()=>{selected=null;urls.clear();syncButton();});
function portraitPath(t){const path=t?.state?.portrait_path;return typeof path==='string'&&/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/i.test(path)?path:null;}
async function signed(path){const cached=urls.get(path);if(cached&&cached.expires>Date.now())return cached.url;const {data,error}=await db.storage.from(bucket).createSignedUrl(path,3600);if(error)throw error;urls.set(path,{url:data.signedUrl,expires:Date.now()+3300000});return data.signedUrl;}
async function paint(){const serial=++renderSerial;const elements=[...layer.querySelectorAll('.token[data-id]')];if(!elements.length)return;const ids=elements.map(el=>el.dataset.id);const {data,error}=await db.from('scene_tokens').select('id,state').in('id',ids);if(error){console.warn('Portrait lookup:',error.message);return;}if(serial!==renderSerial)return;const paths=new Map((data||[]).map(t=>[t.id,portraitPath(t)]));for(const el of elements){const path=paths.get(el.dataset.id);const previous=el.querySelector('.token-portrait');if(!path){previous?.remove();continue;}try{const url=await signed(path);if(serial!==renderSerial||!el.isConnected)return;let image=el.querySelector('.token-portrait');if(!image){image=document.createElement('img');image.className='token-portrait';image.alt='';image.draggable=false;image.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;pointer-events:none;';const initials=el.querySelector('.initials');if(initials)initials.style.display='none';el.insertBefore(image,el.firstChild);}if(image.src!==url)image.src=url;}catch(e){console.warn('Portrait unavailable:',e.message);}}
}
let refreshTimer=null;const schedule=()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{syncButton();paint().catch(console.error);},120);};
new MutationObserver(schedule).observe(layer,{childList:true});
new MutationObserver(syncButton).observe(document.getElementById('roleLabel'),{childList:true,characterData:true,subtree:true});
input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file||!selected||!isGM()||uploading)return;const tokenId=selected;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024){alert('Choose a PNG, JPEG, WebP, or GIF image smaller than 5 MB.');return;}
 uploading=true;syncButton();let path=null;
 try{
  const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error('Sign in as GM first.');
  const code=document.getElementById('codeLabel')?.textContent?.trim();if(!code)throw Error('No active session.');
  const {data:sessions,error:sessionError}=await db.from('game_sessions').select('id,campaign_id').eq('join_code',code).eq('is_active',true);if(sessionError)throw sessionError;
  let campaign=null;for(const session of sessions||[]){const {data:member}=await db.from('campaign_members').select('role').eq('campaign_id',session.campaign_id).eq('user_id',user.id).eq('role','gm').maybeSingle();if(member){campaign=session.campaign_id;break;}}
  if(!campaign)throw Error('GM permission required.');
  const {data:token,error:tokenError}=await db.from('scene_tokens').select('id,state,scene_id').eq('id',tokenId).single();if(tokenError)throw tokenError;
  const {data:scene,error:sceneError}=await db.from('scenes').select('session_id').eq('id',token.scene_id).single();if(sceneError)throw sceneError;
  const session=sessions.find(s=>s.id===scene.session_id&&s.campaign_id===campaign);if(!session||!currentIds().has(tokenId))throw Error('Token is not in your active session.');
  const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[file.type];
  path=`${campaign}/${tokenId}/${crypto.randomUUID()}.${extension}`;
  const {error:uploadError}=await db.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;
  const state={...(token.state||{}),portrait_path:path};
  const {data:updated,error:updateError}=await db.from('scene_tokens').update({state}).eq('id',tokenId).select('id').single();if(updateError||!updated)throw updateError||Error('Portrait update was rejected.');
  urls.delete(path);schedule();button.textContent='PORTRAIT SAVED';
 }catch(e){console.error('Portrait upload:',e);alert(`Portrait could not be saved: ${e.message}`);}
 finally{uploading=false;syncButton();}
});
schedule();
