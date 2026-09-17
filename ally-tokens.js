// Ally classification lives in scene_tokens.state.console_team; token_kind remains a valid database enum.
const allyStyle=document.createElement('style');
allyStyle.textContent='.token.ally-team{border-color:#55e79a!important;background:#123e2b!important;box-shadow:0 4px 14px #000b,0 0 0 2px #07131a,0 0 12px #55e79a55!important}.token-row.ally-team{border-left:3px solid #55e79a!important}';
document.head.appendChild(allyStyle);
function markAllies(){for(const el of document.querySelectorAll('#tokenLayer .token')){const id=el.dataset.id;if(!id)continue;const row=[...document.querySelectorAll('#tokenList .token-row')].find(r=>r.textContent?.includes(el.querySelector('.token-name')?.textContent||'\u0000'));if(row)row.classList.remove('ally-team');el.classList.remove('ally-team');} }
// Supabase realtime events already re-render tokens; inspect rendered tokens through a GM-safe,
// read-only scene query rather than relying on labels or DOM order.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t',{auth:{storageKey:'destiny-ally-style-auth'}});
let running=false;
async function paint(){if(running)return;const layer=document.getElementById('tokenLayer');if(!layer||document.getElementById('tableView')?.classList.contains('hidden'))return;const ids=[...layer.querySelectorAll('.token[data-id]')].map(e=>e.dataset.id);if(!ids.length)return;running=true;try{const {data,error}=await db.from('scene_tokens').select('id,state').in('id',ids);if(error)return;const allies=new Set((data||[]).filter(t=>t.state?.console_team==='ally').map(t=>t.id));for(const el of layer.querySelectorAll('.token[data-id]'))el.classList.toggle('ally-team',allies.has(el.dataset.id));}finally{running=false}}
new MutationObserver(()=>{paint().catch(()=>{})}).observe(document.getElementById('tokenLayer'),{childList:true});
setInterval(()=>{paint().catch(()=>{})},2500);
