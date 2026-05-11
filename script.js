(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");

  const sync = () => {
    const dark = root.dataset.theme === "dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
  };

  btn.addEventListener("click", () => {
    const dark = root.dataset.theme === "dark";
    if (dark) {
      delete root.dataset.theme;
      localStorage.setItem("theme", "light");
    } else {
      root.dataset.theme = "dark";
      localStorage.setItem("theme", "dark");
    }
    sync();
  });

  sync();

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();

/* =========================================================================
   Charizard — pixel-art SVG sprite shared by the ambient companion and
   the Konami-code easter egg. Sprite is 20 wide × 14 tall, flying right.
   ========================================================================= */
const CHARIZARD = (function () {
  const SVGNS = "http://www.w3.org/2000/svg";

  // 20 × 14 pixel art Charizard. Each char = one pixel.
  // .=transparent  W=wing  w=wing-shade  o=orange  O=orange-shade
  // b=outline  E=eye  L=belly  l=belly-shade  D=dark-orange (tail base)
  // F=flame-yellow  R=flame-red
  const SPRITE = [
    "....................",
    ".....W..........bb..",
    "....WWW........boob.",
    "...WWWWW......boooob",
    "..WWWWWWW....boooooo",
    ".WWWWWWWWWoooEoooobb",
    "WWWWWWWWWoooooooooob",
    ".wwwwwwwwooollllllOb",
    "...wwoooLLLLLLLLLLoO",
    "....oooLLLLLLLLLLLo.",
    "..DoooLLLLLLLLLLLo..",
    ".DDoooooooollLLL....",
    "DFFooooooooo........",
    "FRF.ooo.............",
  ];

  const PAL = {
    ".": null,
    W: "#c44d12",  // wing
    w: "#8a3508",  // wing shade
    o: "#ff6d00",  // orange
    O: "#c44d12",  // orange shade
    b: "#1a0e08",  // outline / black
    E: "#ffffff",  // eye
    L: "#ffd180",  // belly
    l: "#e6b46f",  // belly shade
    D: "#a83a0c",  // dark shading (tail base)
    F: "#ffd54f",  // flame body
    R: "#ff5722",  // flame core
  };

  function build(pxSize) {
    const W = 20;
    const H = SPRITE.length;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W * pxSize);
    svg.setAttribute("height", H * pxSize);
    svg.setAttribute("shape-rendering", "crispEdges");

    const gWing = document.createElementNS(SVGNS, "g");
    gWing.setAttribute("class", "ch-wing");
    const gBody = document.createElementNS(SVGNS, "g");
    const gFlame = document.createElementNS(SVGNS, "g");
    gFlame.setAttribute("class", "ch-flame");

    SPRITE.forEach((row, y) => {
      for (let x = 0; x < row.length && x < W; x++) {
        const c = row[x];
        const fill = PAL[c];
        if (!fill) continue;
        const r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("x", x);
        r.setAttribute("y", y);
        r.setAttribute("width", 1);
        r.setAttribute("height", 1);
        r.setAttribute("fill", fill);
        if (c === "W" || c === "w") gWing.appendChild(r);
        else if (c === "F" || c === "R") gFlame.appendChild(r);
        else gBody.appendChild(r);
      }
    });

    // Order: wings behind body, flame on top
    svg.appendChild(gWing);
    svg.appendChild(gBody);
    svg.appendChild(gFlame);
    return svg;
  }

  return { build, W: 20, H: SPRITE.length };
})();

/* =========================================================================
   Ambient companion — pixel-art Charizard floating at bottom-right.
   - Slow bobbing idle motion.
   - Position oscillates with scrollY (figure-8 around base).
   - Spawns fire breath particles during active scrolling.
   - Click to dismiss (flies off).
   ========================================================================= */
(function ambient() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 720) return;

  const PX = 4; // pixel-art scale: 4 CSS pixels per sprite pixel

  const style = document.createElement("style");
  style.textContent = `
#ch-amb {
  position: fixed; bottom: 5vh; right: 3vw;
  z-index: 50; pointer-events: auto; cursor: pointer;
  will-change: transform;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,0.28)) drop-shadow(0 0 20px rgba(255,100,0,0.18));
  transition: opacity 0.4s ease;
}
#ch-amb svg { display: block; image-rendering: pixelated; }
#ch-amb .ch-wing {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: chFlap 0.42s ease-in-out infinite alternate;
}
@keyframes chFlap {
  from { transform: translateY(0) scaleY(1); }
  to   { transform: translateY(0.6px) scaleY(0.78); }
}
#ch-amb .ch-flame {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: chFlick 0.18s steps(2) infinite;
}
@keyframes chFlick {
  0%   { transform: scaleY(1) scaleX(1); opacity: 1; }
  50%  { transform: scaleY(1.2) scaleX(0.85); opacity: 0.9; }
}
.ch-puff {
  position: fixed; width: 10px; height: 10px;
  pointer-events: none; z-index: 49; border-radius: 50%;
  background: radial-gradient(circle, #fff8d6 0%, #ffd54f 30%, #ff6d00 70%, #d62b00 100%);
  animation: chPuff 0.95s ease-out forwards;
  mix-blend-mode: screen;
}
@keyframes chPuff {
  0%   { opacity: 0; transform: scale(0.25); }
  20%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(2.4) translate(70px, -28px); }
}
@media (max-width: 720px) { #ch-amb { display: none; } }
`;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.id = "ch-amb";
  wrap.setAttribute("aria-hidden", "true");
  wrap.appendChild(CHARIZARD.build(PX));
  document.body.appendChild(wrap);

  // Scroll-driven flight path
  let curX = 0, curY = 0;
  let tgtX = 0, tgtY = 0;
  let scrolling = false;
  let scrollStop = null;
  let lastPuff = 0;

  function recalcTarget() {
    const s = window.scrollY;
    // Two slightly-offset frequencies → traces a Lissajous-like figure-8
    tgtX = -Math.sin(s * 0.0042) * 220;
    tgtY = -Math.cos(s * 0.0036) * 110;
  }

  function spawnPuff() {
    const r = wrap.getBoundingClientRect();
    // Mouth ≈ right side, top third of sprite
    const mx = r.right - 6;
    const my = r.top + r.height * 0.32;
    const p = document.createElement("div");
    p.className = "ch-puff";
    p.style.left = mx + (Math.random() - 0.5) * 8 + "px";
    p.style.top = my + (Math.random() - 0.5) * 8 + "px";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }

  function onScroll() {
    recalcTarget();
    scrolling = true;
    clearTimeout(scrollStop);
    scrollStop = setTimeout(() => { scrolling = false; }, 160);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  let dismissed = false;
  wrap.addEventListener("click", () => {
    if (dismissed) return;
    dismissed = true;
    wrap.style.transition = "transform 1.4s cubic-bezier(0.5,0,1,0.5), opacity 1.4s ease";
    wrap.style.transform = `translate(${window.innerWidth + 240}px, -${window.innerHeight * 0.55}px) rotate(-22deg) scale(1.1)`;
    wrap.style.opacity = "0";
    // farewell flame burst
    for (let i = 0; i < 10; i++) setTimeout(spawnPuff, i * 55);
    setTimeout(() => { wrap.remove(); style.remove(); }, 1450);
  });

  function tick() {
    if (dismissed) return;
    curX += (tgtX - curX) * 0.045;
    curY += (tgtY - curY) * 0.045;
    const t = performance.now() / 720;
    const bobX = Math.sin(t) * 3.5;
    const bobY = Math.cos(t * 1.2) * 2.5;
    wrap.style.transform = `translate(${curX + bobX}px, ${curY + bobY}px)`;
    if (scrolling && performance.now() - lastPuff > 75) {
      lastPuff = performance.now();
      spawnPuff();
    }
    requestAnimationFrame(tick);
  }
  recalcTarget();
  tick();
})();

/* =========================================================================
   Konami code easter egg — same pixel sprite, scaled up, flies right→left
   across the screen with a fire wake and Pokémon-style dialog.
   ========================================================================= */
(function konami() {
  const SEQ = [
    "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
    "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
    "b","a",
  ];
  let n = 0;
  document.addEventListener("keydown", (e) => {
    n = e.key === SEQ[n] ? n + 1 : e.key === SEQ[0] ? 1 : 0;
    if (n === SEQ.length) { n = 0; summon(); }
  });

  function summon() {
    if (document.getElementById("char-root")) return;

    const style = document.createElement("style");
    style.id = "char-css";
    style.textContent = css();
    document.head.appendChild(style);

    // Fire wake particles, timed to dragon's path (right → left over 2.5s, 0.3s delay)
    const fires = Array.from({ length: 11 }, (_, i) => {
      const p = 8 + i * 8;
      const d = ((1 - p / 100) * 2.5 + 0.3).toFixed(2);
      const b = (16 + Math.random() * 10).toFixed(1);
      return `<span class="cf" style="left:${p}%;bottom:${b}vh;animation-delay:${d}s">🔥</span>`;
    }).join("");

    const el = document.createElement("div");
    el.id = "char-root";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="c-flash"></div>
      <div class="c-wrap"><div class="c-big"></div></div>
      ${fires}
      <div class="c-dialog">
        <p class="c-l1"></p>
        <p class="c-l2"></p>
      </div>`;
    // Insert mirrored pixel sprite (flying left = head leads)
    const big = el.querySelector(".c-big");
    const sprite = CHARIZARD.build(10);
    sprite.style.transform = "scaleX(-1)";
    big.appendChild(sprite);

    document.body.appendChild(el);

    type(el.querySelector(".c-l1"), "A wild CHARIZARD appeared!", () =>
      setTimeout(() => type(el.querySelector(".c-l2"), "🔥  It's super effective!"), 200));

    const exit = () => {
      el.style.transition = "opacity 0.35s ease";
      el.style.opacity = "0";
      el.addEventListener("transitionend", () => {
        el.remove(); style.remove();
      }, { once: true });
    };
    const timer = setTimeout(exit, 5800);
    el.addEventListener("click", () => { clearTimeout(timer); exit(); });
  }

  function type(el, str, cb) {
    el.textContent = "";
    let i = 0;
    const t = setInterval(() => {
      el.textContent += str[i++];
      if (i >= str.length) { clearInterval(t); cb && cb(); }
    }, 38);
  }

  function css() {
    return `
#char-root {
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: auto; cursor: pointer; overflow: hidden;
}
.c-flash { position: fixed; inset: 0; pointer-events: none; animation: cFlash 0.65s ease-out both; }
@keyframes cFlash {
  0%   { background: rgba(255,90,0,0); }
  18%  { background: rgba(255,90,0,0.65); }
  40%  { background: rgba(255,255,255,0.85); }
  65%  { background: rgba(255,90,0,0.3); }
  100% { background: rgba(255,90,0,0); }
}
.c-wrap {
  position: fixed; bottom: 24vh; pointer-events: none;
  animation: cFly 2.5s cubic-bezier(0.2,0.65,0.45,0.95) 0.3s both;
}
@keyframes cFly {
  from { transform: translateX(calc(100vw + 130px)); }
  to   { transform: translateX(-260px); }
}
.c-big {
  filter: drop-shadow(0 0 16px #ff6d00) drop-shadow(0 0 40px rgba(255,100,0,0.5));
}
.c-big svg { display: block; image-rendering: pixelated; }
.cf {
  position: fixed; pointer-events: none; font-size: 26px;
  animation: cFire 1.15s ease-out both;
}
@keyframes cFire {
  0%   { transform: scale(0.3) translateY(0); opacity: 0; }
  25%  { opacity: 1; }
  60%  { transform: scale(1.5) translateY(-22px); opacity: 1; }
  100% { transform: scale(0.9) translateY(-44px); opacity: 0; }
}
.c-dialog {
  position: fixed; bottom: 5vh; left: 50%;
  transform: translateX(-50%);
  background: var(--bg, #fbfaf7);
  border: 2px solid var(--fg, #161514);
  border-radius: 4px;
  box-shadow: 4px 4px 0 var(--fg, #161514);
  padding: 0.85rem 1.35rem;
  min-width: 270px; max-width: 88vw;
  font-family: var(--font-mono, ui-monospace, monospace);
  pointer-events: none;
  animation: cDialog 0.28s ease-out 0.65s both;
}
@keyframes cDialog {
  from { opacity: 0; transform: translateX(-50%) translateY(14px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.c-dialog p { margin: 0 0 0.2rem; font-size: 0.88rem; color: var(--fg, #161514); min-height: 1.4em; }
.c-dialog p:last-child { margin: 0; }
.c-l1 { font-weight: 600; }
    `;
  }
})();
