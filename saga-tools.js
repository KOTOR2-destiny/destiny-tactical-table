// Destiny Tactical Table v0.2 — isolated Saga measurement controls.
(() => {
  const viewport=document.getElementById('viewport');
  const world=document.getElementById('world');
  const grid=document.getElementById('gridLayer');
  if(!viewport||!world||!grid)return;
  let mode='move', measuring=null;
  const toolbar=document.createElement('div');
  toolbar.className='saga-toolbar';
  toolbar.innerHTML='<button type="button" data-mode="move" class="active">MOVE</button><button type="button" data-mode="range">RANGE</button><button type="button" data-mode="clear">CLEAR</button>';
  viewport.appendChild(toolbar);
  const overlay=document.createElement('div');
  overlay.className='measure-layer';
  world.appendChild(overlay);
  const gridSize=()=>parseFloat(getComputedStyle(grid).backgroundSize)||64;
  function worldPoint(e){
    const rect=world.getBoundingClientRect();
    return {x:(e.clientX-rect.left)*(world.offsetWidth/rect.width),y:(e.clientY-rect.top)*(world.offsetHeight/rect.height)};
  }
  function square(p){const g=gridSize();return {x:Math.floor(p.x/g),y:Math.floor(p.y/g)}}
  // Saga Edition diagonal squares: first diagonal 1, second 2, repeating.
  function distance(a,b){const dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y),diagonal=Math.min(dx,dy);return Math.max(dx,dy)+Math.floor(diagonal/2)}
  function clear(){overlay.replaceChildren();measuring=null}
  function setMode(next){mode=next;clear();toolbar.querySelectorAll('button[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));viewport.classList.toggle('range-mode',mode==='range')}
  // The base tabletop starts a pan on any pointerdown inside the viewport.
  // Stop toolbar pointer events before that handler can capture the pointer.
  toolbar.addEventListener('pointerdown',e=>e.stopPropagation());
  toolbar.addEventListener('pointermove',e=>e.stopPropagation());
  toolbar.addEventListener('pointerup',e=>e.stopPropagation());
  toolbar.addEventListener('pointercancel',e=>e.stopPropagation());
  toolbar.addEventListener('click',e=>{
    const button=e.target.closest('button[data-mode]');if(!button)return;
    e.preventDefault();e.stopPropagation();
    if(button.dataset.mode==='clear')clear();else setMode(button.dataset.mode);
  });
  viewport.addEventListener('pointerdown',e=>{
    if(mode!=='range'||e.target.closest('.saga-toolbar'))return;
    // Range mode must win over the original token-drag and map-pan handlers.
    e.preventDefault();e.stopImmediatePropagation();
    const p=worldPoint(e),s=square(p);
    clear();
    const line=document.createElement('div'),label=document.createElement('div');
    line.className='measure-line';label.className='measure-label';
    overlay.append(line,label);
    measuring={pointerId:e.pointerId,start:p,startSquare:s,line,label};
    viewport.setPointerCapture(e.pointerId);
    draw(e);
  },true);
  function draw(e){
    if(!measuring)return;
    const m=measuring,p=worldPoint(e),end=square(p),dx=p.x-m.start.x,dy=p.y-m.start.y;
    m.line.style.left=`${m.start.x}px`;
    m.line.style.top=`${m.start.y}px`;
    m.line.style.width=`${Math.hypot(dx,dy)}px`;
    m.line.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`;
    m.label.style.left=`${(m.start.x+p.x)/2}px`;
    m.label.style.top=`${(m.start.y+p.y)/2}px`;
    const squares=distance(m.startSquare,end);
    m.label.textContent=`${squares} sq · ${squares*5} ft`;
  }
  viewport.addEventListener('pointermove',e=>{
    if(!measuring||e.pointerId!==measuring.pointerId)return;
    e.preventDefault();e.stopImmediatePropagation();draw(e);
  },true);
  function finish(e){
    if(!measuring||e.pointerId!==measuring.pointerId)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(e.type==='pointerup')draw(e);
    measuring=null;
    if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);
  }
  viewport.addEventListener('pointerup',finish,true);
  viewport.addEventListener('pointercancel',finish,true);
})();