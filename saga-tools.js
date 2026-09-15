// Destiny Tactical Table v0.2 — Saga measurement layer
(() => {
  const viewport=document.getElementById('viewport'), world=document.getElementById('world'), tokenLayer=document.getElementById('tokenLayer');
  if(!viewport||!world||!tokenLayer)return;
  let mode='move', start=null, line=null, label=null;
  const toolbar=document.createElement('div'); toolbar.className='saga-toolbar';
  toolbar.innerHTML='<button data-mode="move" class="active">MOVE</button><button data-mode="range">RANGE</button><button data-mode="clear">CLEAR</button>';
  viewport.appendChild(toolbar);
  const overlay=document.createElement('div'); overlay.className='measure-layer'; world.appendChild(overlay);
  function gridSize(){const bg=getComputedStyle(document.getElementById('gridLayer')).backgroundSize.split(' ')[0];return parseFloat(bg)||64}
  function worldPoint(e){const r=world.getBoundingClientRect(), sx=world.offsetWidth/r.width||1, sy=world.offsetHeight/r.height||1;return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}}
  function square(p){const g=gridSize();return{x:Math.floor(p.x/g),y:Math.floor(p.y/g)}}
  function sagaDistance(a,b){const dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y);const diag=Math.min(dx,dy),straight=Math.max(dx,dy)-diag;return straight+diag+Math.floor(diag/2)}
  function clear(){overlay.innerHTML='';start=line=label=null}
  toolbar.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mode==='clear'){clear();return}mode=b.dataset.mode;toolbar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));clear()};
  viewport.addEventListener('pointerdown',e=>{if(mode!=='range'||e.target.closest('.token')||e.target.closest('.saga-toolbar'))return;e.preventDefault();e.stopImmediatePropagation();const p=worldPoint(e);start={p,s:square(p)};clear();start={p,s:square(p)};line=document.createElement('div');line.className='measure-line';label=document.createElement('div');label.className='measure-label';overlay.append(line,label)},true);
  viewport.addEventListener('pointermove',e=>{if(!start||mode!=='range')return;e.preventDefault();e.stopImmediatePropagation();const p=worldPoint(e),s=square(p),dx=p.x-start.p.x,dy=p.y-start.p.y,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI,dist=sagaDistance(start.s,s);line.style.cssText=`left:${start.p.x}px;top:${start.p.y}px;width:${len}px;transform:rotate(${ang}deg)`;label.style.left=`${(start.p.x+p.x)/2}px`;label.style.top=`${(start.p.y+p.y)/2}px`;label.textContent=`${dist} sq · ${dist*1.5} m`},true);
  viewport.addEventListener('pointerup',e=>{if(!start||mode!=='range')return;e.preventDefault();e.stopImmediatePropagation();start=null},true);
})();