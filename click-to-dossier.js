// GM-only navigation to the local Console. No dossier data is sent to the Table.
const layer=document.getElementById('tokenLayer');
let start=null;
layer.addEventListener('pointerdown',e=>{const token=e.target.closest('.token[data-id]');start=token?{id:token.dataset.id,x:e.clientX,y:e.clientY}:null;},true);
layer.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)start=null;},true);
layer.addEventListener('pointercancel',()=>{start=null;},true);
layer.addEventListener('click',e=>{
 const token=e.target.closest('.token[data-id]');if(!token||!start||token.dataset.id!==start.id)return;
 start=null;
 if(document.getElementById('roleLabel')?.textContent?.trim().toUpperCase()!=='GM')return;
 const url=new URL('http://127.0.0.1:8080/');url.searchParams.set('tactical_dossier_token',token.dataset.id);window.open(url.href,'_blank','noopener');
},true);
