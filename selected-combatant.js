// Read-only selected combatant overview. Never writes combat state or opens dossiers.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const layer=document.getElementById('tokenLayer'),role=document.getElementById('roleLabel'),table=document.getElementById('tableView');
const panel=document.createElement('section');panel.id='selectedCombatantPanel';panel.className='combat-panel';panel.hidden=true;
panel.innerHTML='<div class="panel-title">SELECTED COMBATANT · READ ONLY</div><div id="selectedCombatantDetails" aria-live="polite">Select a token to inspect its combat stats.</div>';
document.getElementById('tokenList').parentElement.insertBefore(panel,document.getElementById('tokenList'));
const details=panel.querySelector('#selectedCombatantDetails');
let selected=null,request=0;
const isGm=()=>role.textContent.trim().toLowerCase()==='gm';
const show=()=>{panel.hidden=!isGm()||table.classList.contains('hidden');};
const condition=n=>({'0':'Normal','-1':'−1 step','-2':'−2 steps','-3':'−3 steps','-4':'−4 steps','-5':'Helpless'})[String(n)]??'Unknown';
function line(label,value){const el=document.createElement('div');el.className='meta-line';const key=document.createElement('span');key.textContent=label+' ';const val=document.createElement('strong');val.textContent=String(value);el.append(key,val);details.append(el);}
async function refresh(){show();const current=selected,serial=++request;if(!current||!isGm()||table.classList.contains('hidden'))return;if(!layer.querySelector(`.token[data-id="${CSS.escape(current)}"]`)){selected=null;details.textContent='Select a token to inspect its combat stats.';return;}
 const {data,error}=await db.from('scene_tokens').select('id,label,state').eq('id',current).maybeSingle();if(serial!==request||selected!==current)return;
 if(error||!data){details.textContent=error?'Unable to load combat stats.':'Token no longer exists.';return;}
 const s=data.state||{};details.replaceChildren();const heading=document.createElement('strong');heading.textContent=data.label;details.append(heading);
 line('HP',`${s.hp??'—'} / ${s.max_hp??'—'}`);line('Condition',condition(s.condition_step??0));line('Initiative',s.initiative??'—');line('Turn',s.active_turn===true||s.is_active_turn===true?'Active': 'See initiative tracker');
}
layer.addEventListener('pointerdown',e=>{if(!isGm())return;const token=e.target.closest('.token[data-id]');if(token){selected=token.dataset.id;refresh();}},true);
const observer=new MutationObserver(()=>{show();if(selected)refresh();});observer.observe(layer,{childList:true});observer.observe(role,{childList:true,subtree:true,characterData:true});observer.observe(table,{attributes:true,attributeFilter:['class']});
// Combat state can change without token DOM changes (e.g. from the Command Console).
setInterval(()=>{if(selected&&isGm()&&!table.classList.contains('hidden'))refresh();},2500);
show();