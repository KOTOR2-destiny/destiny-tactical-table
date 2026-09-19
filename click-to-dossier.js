// GM-only navigation to the existing local Command Console tab. No dossier data is sent to the Table.
const layer=document.getElementById('tokenLayer');
let start=null;
layer.addEventListener('pointerdown',e=>{const token=e.target.closest('.token[data-id]');start=token?{id:token.dataset.id,x:e.clientX,y:e.clientY}:null;},true);
layer.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)start=null;},true);
layer.addEventListener('pointercancel',()=>{start=null;},true);
layer.addEventListener('click',e=>{
 const token=e.target.closest('.token[data-id]');if(!token||!start||token.dataset.id!==start.id)return;
 start=null;
 if(document.getElementById('roleLabel')?.textContent?.trim().toUpperCase()!=='GM')return;
 const url=new URL('http://127.0.0.1:8080/');url.searchParams.set('tactical_dossier_token',token.dataset.id);
 // The local Console names its existing tab destiny-command-console. Reuse it rather than
 // opening _blank each time. Cross-origin navigation reloads the Console, so re-enable sync.
 const consoleTab=window.open(url.href,'destiny-command-console');
 if(consoleTab){try{consoleTab.opener=null;}catch(_){/* Cross-origin browser protection. */}}
},true);
