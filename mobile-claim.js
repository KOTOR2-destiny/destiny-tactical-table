// Mobile player controls: expose the hidden desktop token-list claim actions as a touch tray.
const tableView=document.getElementById('tableView');
const tokenList=document.getElementById('tokenList');
const roleLabel=document.getElementById('roleLabel');

const tray=document.createElement('div');
tray.id='mobileClaimTray';
tray.innerHTML='<div class="mobile-claim-title">CHOOSE YOUR CHARACTER</div><div class="mobile-claim-buttons"></div>';
document.body.appendChild(tray);

function syncClaimTray(){
  const mobile=window.matchMedia('(max-width: 900px)').matches;
  const inTable=tableView&&!tableView.classList.contains('hidden');
  const player=roleLabel?.textContent?.trim()==='PLAYER';
  const buttons=tray.querySelector('.mobile-claim-buttons');
  buttons.innerHTML='';
  if(!mobile||!inTable||!player){tray.classList.remove('show');return;}

  const rows=[...tokenList.querySelectorAll('.token-row')];
  const mine=rows.find(r=>r.querySelector('.you'));
  if(mine){
    tray.querySelector('.mobile-claim-title').textContent=`CONTROL: ${mine.querySelector('span')?.textContent?.trim()||'CHARACTER'}`;
    tray.classList.add('show','claimed');
    return;
  }

  tray.classList.remove('claimed');
  tray.querySelector('.mobile-claim-title').textContent='CHOOSE YOUR CHARACTER';
  for(const row of rows){
    if(row.style.cursor!=='pointer')continue;
    const name=row.querySelector('span')?.textContent?.trim();
    if(!name)continue;
    const b=document.createElement('button');
    b.type='button';b.textContent=name;
    b.addEventListener('click',()=>row.click());
    buttons.appendChild(b);
  }
  tray.classList.toggle('show',buttons.children.length>0);
}

new MutationObserver(syncClaimTray).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
window.addEventListener('resize',syncClaimTray);
setTimeout(syncClaimTray,250);
