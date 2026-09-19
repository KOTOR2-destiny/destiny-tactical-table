// GM-only dossier command. Selecting or moving a token never opens its dossier.
// The existing Command Console listens on the session's Realtime channel.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const layer=document.getElementById('tokenLayer');
const topActions=document.querySelector('.top-actions');
let start=null,selected=null,channel=null,channelSession='',ready=false,sending=false;
const accessButton=document.createElement('button');
accessButton.id='accessDossierBtn';
accessButton.type='button';
accessButton.className='secondary hidden';
accessButton.textContent='ACCESS DOSSIER';
accessButton.disabled=true;
if(topActions)topActions.insertBefore(accessButton,document.getElementById('signOutBtn'));
function isGM(){return document.getElementById('roleLabel')?.textContent?.trim().toUpperCase()==='GM'&&!document.getElementById('tableView')?.classList.contains('hidden');}
function clearSelection(){selected=null;document.querySelectorAll('#tokenLayer .token.dossier-selected').forEach(el=>{el.classList.remove('dossier-selected');el.style.outline='';el.style.outlineOffset='';});accessButton.classList.add('hidden');accessButton.disabled=true;accessButton.textContent='ACCESS DOSSIER';}
function selectToken(id){
 if(!isGM()){clearSelection();return;}
 const token=Array.from(layer.querySelectorAll('.token[data-id]')).find(el=>el.dataset.id===id);
 if(!token){clearSelection();return;}
 selected=id;
 document.querySelectorAll('#tokenLayer .token.dossier-selected').forEach(el=>{el.classList.remove('dossier-selected');el.style.outline='';el.style.outlineOffset='';});
 token.classList.add('dossier-selected');token.style.outline='2px solid #e9c878';token.style.outlineOffset='2px';
 accessButton.classList.remove('hidden');accessButton.disabled=sending;accessButton.textContent='ACCESS DOSSIER';
}
layer.addEventListener('pointerdown',e=>{const token=e.target.closest('.token[data-id]');start=token?{id:token.dataset.id,x:e.clientX,y:e.clientY}:null;},true);
layer.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)start=null;},true);
layer.addEventListener('pointercancel',()=>{start=null;},true);
layer.addEventListener('click',e=>{
 const token=e.target.closest('.token[data-id]');if(!token||!start||token.dataset.id!==start.id)return;
 start=null;selectToken(token.dataset.id);
},true);
// Token rendering replaces DOM nodes during movement/realtime updates. Restore selection
// without sending any dossier command; clear it if the token is removed.
const observer=new MutationObserver(()=>{
 if(!selected)return;
 if(!isGM()){clearSelection();return;}
 const token=Array.from(layer.querySelectorAll('.token[data-id]')).find(el=>el.dataset.id===selected);
 if(!token){clearSelection();return;}
 if(!token.classList.contains('dossier-selected')){
  token.classList.add('dossier-selected');token.style.outline='2px solid #e9c878';token.style.outlineOffset='2px';
 }
});
observer.observe(layer,{childList:true});
async function send(tokenId){
 const code=document.getElementById('codeLabel')?.textContent?.trim();
 if(!code)throw new Error('No active Tactical Table session.');
 const {data:{user},error:userError}=await db.auth.getUser();if(userError||!user)throw new Error('Sign in to the Tactical Table first.');
 const {data:sessions,error}=await db.from('game_sessions').select('id,campaign_id').eq('join_code',code).eq('is_active',true);
 if(error||!sessions?.length)throw new Error('Active session not found.');
 const memberships=await Promise.all(sessions.map(async s=>({s,m:await db.from('campaign_members').select('role').eq('campaign_id',s.campaign_id).eq('user_id',user.id).eq('role','gm').maybeSingle()})));
 const session=memberships.find(x=>x.m.data&&!x.m.error)?.s;if(!session)throw new Error('GM authorization required.');
 if(channelSession!==session.id||!channel){
  if(channel)await db.removeChannel(channel);
  channelSession=session.id;ready=false;
  channel=db.channel('destiny-dossier:'+session.id,{config:{broadcast:{ack:true}}});
  await new Promise(resolve=>{const timeout=setTimeout(resolve,3500);channel.subscribe(status=>{if(status==='SUBSCRIBED'){ready=true;clearTimeout(timeout);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);resolve();}})});
 }
 if(!ready)throw new Error('Dossier connection is not ready.');
 const result=await channel.send({type:'broadcast',event:'select-token',payload:{token_id:tokenId}});
 if(result!=='ok')throw new Error('Dossier command was not delivered.');
}
accessButton.addEventListener('click',async()=>{
 if(sending||!selected||!isGM())return;
 const tokenId=selected;
 if(!Array.from(layer.querySelectorAll('.token[data-id]')).some(el=>el.dataset.id===tokenId)){clearSelection();return;}
 sending=true;accessButton.disabled=true;accessButton.textContent='ACCESSING…';
 try{await send(tokenId);accessButton.textContent='ACCESS DOSSIER';}
 catch(error){console.error('Dossier command failed:',error);accessButton.textContent='DOSSIER UNAVAILABLE';}
 finally{sending=false;accessButton.disabled=!selected||!isGM();}
});
document.getElementById('backLobbyBtn')?.addEventListener('click',clearSelection);
document.getElementById('signOutBtn')?.addEventListener('click',clearSelection);
