import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
// Use the same default Supabase auth storage as app.js; never create a separate sign-in.
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const style=document.createElement('style');style.textContent='.token.ally-team{border-color:#55e79a!important;background:#123e2b!important;box-shadow:0 4px 14px #000b,0 0 0 2px #07131a,0 0 12px #55e79a55!important}';document.head.append(style);
let busy=false;
async function paint(){if(busy)return;const layer=document.getElementById('tokenLayer');if(!layer||document.getElementById('tableView')?.classList.contains('hidden'))return;const ids=[...layer.querySelectorAll('.token[data-id]')].map(e=>e.dataset.id);if(!ids.length)return;busy=true;try{const {data,error}=await db.from('scene_tokens').select('id,state').in('id',ids);if(error)return;const allies=new Set((data||[]).filter(t=>t.state?.console_team==='ally').map(t=>t.id));for(const el of layer.querySelectorAll('.token[data-id]'))el.classList.toggle('ally-team',allies.has(el.dataset.id));}finally{busy=false}}
new MutationObserver(()=>{paint().catch(()=>{})}).observe(document.getElementById('tokenLayer'),{childList:true});
setInterval(()=>{paint().catch(()=>{})},2500);
