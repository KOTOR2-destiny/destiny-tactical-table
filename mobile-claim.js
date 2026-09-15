// Mobile player adapter: tapping a locked PC token invokes the existing claim action
// already attached to that character's token-list row by app.js.
const viewport = document.getElementById('viewport');

viewport?.addEventListener('pointerup', (event) => {
  if (event.pointerType !== 'touch') return;
  const token = event.target.closest('.token.locked');
  if (!token) return;

  const label = token.querySelector('.token-name')?.textContent?.replace(/ · YOU$/, '').trim();
  if (!label) return;

  const rows = [...document.querySelectorAll('#tokenList .token-row')];
  const row = rows.find((item) => item.querySelector('span')?.textContent?.trim() === label);
  if (!row || row.style.cursor !== 'pointer') return;

  event.preventDefault();
  event.stopPropagation();
  row.click();
}, true);
