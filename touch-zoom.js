// Touch pinch adapter for the v0.1 tactical viewport.
// Converts a two-finger pinch into the same wheel-zoom path used by app.js,
// keeping the existing scale/pan state authoritative.
(() => {
  const viewport = document.getElementById('viewport');
  if (!viewport) return;

  const touches = new Map();
  let lastDistance = null;

  const distance = () => {
    const pts = [...touches.values()];
    if (pts.length < 2) return null;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const midpoint = () => {
    const pts = [...touches.values()];
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  };

  viewport.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || e.target.closest('.token')) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) lastDistance = distance();
  }, true);

  viewport.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size !== 2 || lastDistance == null) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    const nextDistance = distance();
    if (!nextDistance || Math.abs(nextDistance - lastDistance) < 2) return;
    const mid = midpoint();
    viewport.dispatchEvent(new WheelEvent('wheel', {
      clientX: mid.x,
      clientY: mid.y,
      deltaY: nextDistance > lastDistance ? -1 : 1,
      bubbles: false,
      cancelable: true
    }));
    lastDistance = nextDistance;
  }, true);

  const finish = e => {
    touches.delete(e.pointerId);
    if (touches.size < 2) lastDistance = null;
  };
  viewport.addEventListener('pointerup', finish, true);
  viewport.addEventListener('pointercancel', finish, true);
})();
