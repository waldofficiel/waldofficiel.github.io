// WALD OFF : la vraie Polo (détourée, plaque floutée) déboule à l'écran avec le cri « POLO ! »
// quand on arrive aux photos des voitures, et à chaque clic sur la petite Polo du bas.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SRC = 'img/polo_reelle.webp', DUREE = 3650;
  var img = new Image(); img.alt = ''; img.setAttribute('aria-hidden', 'true');
  img.style.cssText = 'position:fixed;left:50%;bottom:6vh;width:min(92vw,460px);height:auto;transform:translateX(-50%);pointer-events:none;z-index:31;display:none;filter:drop-shadow(0 18px 22px rgba(0,0,0,.7))';
  document.body.appendChild(img);
  var pre = new Image(); pre.src = SRC;                      // préchargement

  var cri = new Audio('live/sons/polo.mp3'); cri.preload = 'auto'; cri.volume = .85; var unlocked = false;
  function unlock() { if (unlocked) return; unlocked = true; cri.play().then(function () { cri.pause(); cri.currentTime = 0; }).catch(function () { unlocked = false; }); }
  addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);

  var busy = false;
  function polo() {
    if (busy) return; busy = true;
    try { cri.currentTime = 0; cri.play().catch(function () {}); } catch (e) {}
    if (reduce) { setTimeout(function () { busy = false; }, 800); return; }
    img.src = SRC + '?t=' + Date.now();                     // relance l'animation depuis le début
    img.style.display = 'block';
    setTimeout(function () {
      var b = img.getBoundingClientRect();
      if (window.wfBoom) { wfBoom(b.left + b.width / 2, b.top + b.height * .55, 1.4); wfBoom(b.left + b.width * .2, b.top + b.height * .7, .9); wfBoom(b.left + b.width * .8, b.top + b.height * .7, .9); }
      img.style.display = 'none'; busy = false;
    }, DUREE);
  }
  window.wfPolo = polo;

  var target = document.querySelector('.gallery'), fired = false;
  if (target && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !fired) { fired = true; polo(); } }); }, { threshold: .35 }).observe(target);
  }
  var mini = document.getElementById('polo');
  if (mini) { mini.style.pointerEvents = 'auto'; mini.style.cursor = 'pointer'; mini.addEventListener('click', function () { unlock(); polo(); }); }
})();
