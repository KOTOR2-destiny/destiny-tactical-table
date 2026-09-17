// GM-only token removal. Uses the same authenticated Supabase session as the table.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.105.0';
const db=createClient('https://zeyvkuhqgbqjqalxubrq.supabase.co','sb_publishable_trF3YpEfBC7rMZpxs0lzzg_utxyNU7t');
const layer=document.getElementById('tokenLayer');
const list=document.getElementById('tokenList');
const role=document.getElementById('roleLabel');
const feed=document.getElementById('feed');
let busy=false;
function notify(text){const line=document.createElement('div');line.className='feed-entry';line.textContent=text;feed.prepend(line);}
function attach(){const gm=role.textContent.trim().toLowerCase()==='gm';const tokens=[...layer.querySelectorAll('.token[data-id]')];const rows=[...list.querySelectorAll('.token-row')];rows.forEach((row,i)=>{row.querySelector('.gm-remove-token')?.remove();if(!gm||!tokens[i])return;const id=tokens[i].dataset.id;const name=tokens[i].querySelector('.token-name')?.textContent?.trim()||'this token';const button=document.createElement('button');button.type='button';button.className='gm-remove-token';button.textContent='REMOVE';button.title=`Remove ${name} from this scene`;
button.style.cssText='margin-left:8px;padding:5px 8px;font-size:11px;flex-shrink:0';button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(busy||role.textContent.trim().toLowerCase()!=='gm')return;if(!window.confirm(`Remove ${name} from this scene? This cannot be undone.`))return;busy=true;button.disabled=true;try{const {data,error}=await db.from('scene_tokens').delete().eq('id',id).select('id');if(error)throw error;if(!data?.some(t=>t.id===id))throw Error('Deletion was not permitted.');notify(`${name} removed. Refreshing table…`);window.location.reload();}catch(error){notify(`REMOVE FAILED: ${error.message}`);busy=false;button.disabled=false;}});row.appendChild(button);});}
new MutationObserver(attach).observe(layer,{childList:true});new MutationObserver(attach).observe(role,{childList:true,subtree:true,characterData:true});attach();
