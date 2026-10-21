// ───────── 시작 ─────────
function fit() {
  const pad = document.getElementById('pad'), keys = document.getElementById('keys');
  const pc = document.body.classList.contains('pc');
  const vw = Math.min(window.innerWidth, pc ? 820 : 560) - 28;
  const vh = window.innerHeight - (pc ? 0 : pad.offsetHeight) - (pc ? keys.offsetHeight + 120 : 70);
  let s = Math.min(vw / 160, vh / 144);
  if (pc && s >= 2) s = Math.floor(s);
  s = Math.max(1, s);
  cv.style.width = Math.round(160 * s) + 'px';
  cv.style.height = Math.round(144 * s) + 'px';
}
addEventListener('resize', fit);
if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) setMode('pc', true);
document.getElementById('padToggle').addEventListener('click', e => { e.preventDefault(); setMode('touch', true); try { cv.focus(); } catch (_) {} });
loadOpt();
bindPad();
fit();
G.scene = TITLE;
playMusic('title');
requestAnimationFrame(loop);
window.__G = G;
