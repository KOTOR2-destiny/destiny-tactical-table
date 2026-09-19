// The backdrop's dimensions are visual only; scene grid dimensions define playable token bounds.
// Keep the core app's private scene state coherent by re-entering the table after a grid resize.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const get=id=>document.getElementById(id);
const panel=get('backdropEditor');
const status=get('backdropStatus');
const controls=document.createElement('div');
controls.id='sceneGridResize';
controls.innerHTML='<div class="divider"></div><div class="panel-title">PLAYABLE GRID</div><p class="small">Backdrop width and height do not change token movement bounds. Expand the playable grid to include the entire backdrop.</p><button type="button" id="expandGridToBackdrop" class="secondary">EXPAND GRID TO BACKDROP</button><div id="gridResizeStatus" class="message" role="status" aria-live="polite"></div>';
panel?.append(controls);
let scene=null,sessionId=null,channel=null,busy=false,loading=false;
const message=s=>{get('gridResizeStatus').textContent=s;};
const isGM=()=>get('roleLabel')?.textContent?.trim().toUpperCase()==='GM'&&!get('tableView')?.classList.contains('hidden');
async function load(){
 if(loading||!isGM())return;
 const code=get('codeLabel')?.textContent?.trim();if(!code)return;
 loading=true;
 try{
  const {data:{user}}=await db.auth.getUser();if(!user)return;
  const {data:sessions,error}=await db.from('game_sessions').select('id,campaign_id').eq('join_code',code).eq('is_active',true);if(error)throw error;
  let active=null;
  for(const s of sessions||[]){const {data:member}=await db.from('campaign_members').select('role').eq('campaign_id',s.campaign_id).eq('user_id',user.id).eq('role','gm').maybeSingle();if(member){active=s;break;}}
  if(!active)return;
  const {data:scenes,error:sceneError}=await db.from('scenes').select('id,grid_cols,grid_rows,map_alignment').eq('session_id',active.id).eq('is_active',true).order('sort_order').limit(1);if(sceneError)throw sceneError;
  if(!scenes?.length)return;
  scene=scenes[0];
  if(sessionId!==active.id){
   if(channel)await db.removeChannel(channel);
   sessionId=active.id;
   channel=db.channel('grid-resize:'+scene.id).on('postgres_changes',{event:'UPDATE',schema:'public',table:'scenes',filter:`id=eq.${scene.id}`},payload=>{
    const next=payload.new;
    if(!next||!scene)return;
    if(Number(next.grid_cols)!==Number(scene.grid_cols)||Number(next.grid_rows)!==Number(scene.grid_rows)){
      // app.js retains its own scene snapshot; reload updates grid rendering AND drag clamping.
      window.location.reload();
    }
   }).subscribe();
  }
 }catch(e){message('Grid lookup failed: '+e.message);}finally{loading=false;}
}
get('expandGridToBackdrop')?.addEventListener('click',async()=>{
 if(busy||!isGM())return;
 await load();if(!scene)return message('No active scene found.');
 const a={x:Number(get('backdropX').value),y:Number(get('backdropY').value),w:Number(get('backdropW').value),h:Number(get('backdropH').value)};
 if(Object.values(a).some(v=>!Number.isFinite(v))||a.w<=0||a.h<=0)return message('Enter valid backdrop alignment first.');
 if(a.x<0||a.y<0)return message('Negative backdrop offsets cannot fit a grid anchored at zero. Set nonnegative offsets first.');
 const cols=Math.max(Number(scene.grid_cols),Math.ceil(a.x+a.w));
 const rows=Math.max(Number(scene.grid_rows),Math.ceil(a.y+a.h));
 if(cols>500||rows>500)return message('Grid cannot exceed 500 × 500 squares.');
 if(cols===Number(scene.grid_cols)&&rows===Number(scene.grid_rows))return message(`The ${cols} × ${rows} grid already covers this backdrop.`);
 busy=true;get('expandGridToBackdrop').disabled=true;message(`Expanding playable grid to ${cols} × ${rows}…`);
 try{
  const {data,error}=await db.from('scenes').update({grid_cols:cols,grid_rows:rows}).eq('id',scene.id).select('id,grid_cols,grid_rows').single();
  if(error||!data)throw error||Error('Grid update was rejected.');
  message(`Grid expanded to ${cols} × ${rows}. Reloading table…`);
  window.location.reload();
 }catch(e){message('Grid expansion failed: '+e.message);busy=false;get('expandGridToBackdrop').disabled=false;}
});
const observer=new MutationObserver(()=>{if(isGM())load().catch(console.error);else{scene=null;sessionId=null;if(channel){db.removeChannel(channel);channel=null;}}});
observer.observe(get('tableView'),{attributes:true,attributeFilter:['class']});
observer.observe(get('codeLabel'),{childList:true,subtree:true,characterData:true});
load().catch(console.error);
