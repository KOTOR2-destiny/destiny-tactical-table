// GM token removal: only the token explicitly selected on the map can be removed.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const layer=document.getElementById('tokenLayer');
const list=document.getElementById('tokenList');
const role=document.getElementById('roleLabel');
const feed=document.getElementById('feed');
let selectedId=null,busy=false;
const panel=document.createElement('section');
panel.id='selectedTokenActions';
panel.hidden=true;
panel.innerHTML='<div class="panel-title">SELECTED TOKEN</div><div id="selectedTokenName"></div><div id="selectedTokenLocation"></div><button type="button" id="removeSelectedToken">REMOVE SELECTED TOKEN</button><div id="selectedTokenMessage" role="status" aria-live="polite"></div>';
list.parentElement.insertBefore(panel,list);
const nameEl=panel.querySelector('#selectedTokenName');
const locationEl=panel.querySelector('#selectedTokenLocation');
const remove=panel.querySelector('#removeSelectedToken');
const message=panel.querySelector('#selectedTokenMessage');
const style=document.createElement('style');
style.textContent='#selectedTokenActions{margin:8px 0 12px;padding:12px;border:1px solid #477d9a;border-radius:8px;background:rgba(18,54,74,.45)}#selectedTokenActions[hidden]{display:none!important}#selectedTokenName{font-weight:700;overflow-wrap:anywhere}#selectedTokenLocation{font-size:12px;opacity:.8;margin:5px 0 10px}#removeSelectedToken{width:100%;max-width:100%;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box}#selectedTokenMessage{font-size:12px;margin-top:7px;overflow-wrap:anywhere}#tokenList .token-row.gm-selected-token{outline:2px solid #83e5ff;outline-offset:-2px;background:rgba(80,191,237,.25);border-radius:5px}#tokenLayer .token.gm-selected-token{outline:3px solid #83e5ff!important;box-shadow:0 0 0 5px rgba(44,188,242,.3),0 0 22px rgba(44,188,242,.75)!important}';
document.head.appendChild(style);
const isGm=()=>role.textContent.trim().toLowerCase()==='gm';
function notify(text){const line=document.createElement('div');line.className='feed-entry';line.textContent=text;feed.prepend(line);}
function paint(){
  list.querySelectorAll('.gm-remove-token').forEach(button=>button.remove());
  const tokens=[...layer.querySelectorAll('.token[data-id]')];
  const rows=[...list.querySelectorAll('.token-row')];
  const selected=isGm()?tokens.find(token=>token.dataset.id===selectedId):null;
  if(!selected)selectedId=null;
  tokens.forEach(token=>token.classList.toggle('gm-selected-token',!!selected&&token.dataset.id===selectedId));
  rows.forEach((row,index)=>row.classList.toggle('gm-selected-token',!!selected&&tokens[index]?.dataset.id===selectedId));
  panel.hidden=!selected;
  if(!selected)return;
  nameEl.textContent=selected.querySelector('.token-name')?.textContent?.trim()||'Unnamed token';
  const size=Number.parseFloat(selected.style.width)+8;
  const grid=Number.isFinite(size)&&size>0?size:64;
  const x=Math.max(0,Math.round((Number.parseFloat(selected.style.left)-4)/grid));
  const y=Math.max(0,Math.round((Number.parseFloat(selected.style.top)-4)/grid));
  locationEl.textContent=`Map square ${x+1}, ${y+1} · Token ID ${selectedId.slice(0,8)}`;
  remove.disabled=busy;
}
layer.addEventListener('pointerdown',event=>{
  if(!isGm()||busy)return;
  const token=event.target.closest('.token[data-id]');
  if(!token||!layer.contains(token))return;
  selectedId=token.dataset.id;
  message.textContent='';
  paint();
},true);
remove.addEventListener('click',async()=>{
  if(busy||!isGm()||!selectedId)return;
  const tokens=[...layer.querySelectorAll('.token[data-id]')];
  const token=tokens.find(el=>el.dataset.id===selectedId);
  if(!token){selectedId=null;paint();return;}
  const id=selectedId;
  const name=token.querySelector('.token-name')?.textContent?.trim()||'this token';
  if(!window.confirm(`Remove the SELECTED ${name} token (ID ${id.slice(0,8)}) from this scene? This cannot be undone.`))return;
  busy=true;paint();message.textContent='Removing selected token…';
  try{
    const {data,error}=await db.from('scene_tokens').delete().eq('id',id).select('id');
    if(error)throw error;
    if(!data?.some(item=>item.id===id))throw Error('Deletion was not permitted.');
    // Update the visible map/list immediately. The main app's realtime DELETE handler
    // also removes the record from its internal state and keeps the session open.
    const index=tokens.indexOf(token);
    const row=[...list.querySelectorAll('.token-row')][index];
    token.remove();
    row?.remove();
    selectedId=null;
    message.textContent='';
    notify(`${name} removed. You can select another token without rejoining.`);
  }catch(error){message.textContent=`REMOVE FAILED: ${error.message}`;notify(message.textContent);}
  finally{busy=false;paint();}
});
new MutationObserver(()=>queueMicrotask(paint)).observe(layer,{childList:true});
new MutationObserver(()=>queueMicrotask(paint)).observe(role,{childList:true,subtree:true,characterData:true});
paint();
