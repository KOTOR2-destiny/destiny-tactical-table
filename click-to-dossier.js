// GM-only live dossier selection. The Console listens on the selected session's Realtime channel.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const layer=document.getElementById('tokenLayer');
let start=null,channel=null,channelSession='',ready=false;
layer.addEventListener('pointerdown',e=>{const token=e.target.closest('.token[data-id]');start=token?{id:token.dataset.id,x:e.clientX,y:e.clientY}:null;},true);
layer.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)start=null;},true);
layer.addEventListener('pointercancel',()=>{start=null;},true);
async function send(tokenId){
 const code=document.getElementById('codeLabel')?.textContent?.trim();
 if(!code)return;
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 const {data:sessions,error}=await db.from('game_sessions').select('id,campaign_id').eq('join_code',code).eq('is_active',true);
 if(error||!sessions?.length)return;
 const memberships=await Promise.all(sessions.map(async s=>({s,m:await db.from('campaign_members').select('role').eq('campaign_id',s.campaign_id).eq('user_id',user.id).eq('role','gm').maybeSingle()})));
 const session=memberships.find(x=>x.m.data&&!x.m.error)?.s;if(!session)return;
 if(channelSession!==session.id||!channel){if(channel)await db.removeChannel(channel);channelSession=session.id;ready=false;channel=db.channel('destiny-dossier:'+session.id,{config:{broadcast:{ack:true}}});await new Promise(resolve=>{const timeout=setTimeout(resolve,3500);channel.subscribe(status=>{if(status==='SUBSCRIBED'){ready=true;clearTimeout(timeout);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);resolve();}})});}
 if(!ready)return;
 await channel.send({type:'broadcast',event:'select-token',payload:{token_id:tokenId}});
}
layer.addEventListener('click',e=>{
 const token=e.target.closest('.token[data-id]');if(!token||!start||token.dataset.id!==start.id)return;
 start=null;
 if(document.getElementById('roleLabel')?.textContent?.trim().toUpperCase()!=='GM')return;
 send(token.dataset.id).catch(console.error);
},true);
