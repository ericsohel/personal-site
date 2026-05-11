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
   Hand-drawn pixel-art dragon sprite (Charizard-inspired original art).
   22 wide × 17 tall, side profile flying right.
   Two frames — wings up and wings down — alternate to produce a real flap.
   ========================================================================= */
const CHARIZARD = (function () {
  const SVGNS = "http://www.w3.org/2000/svg";

  // Legend:
  //   .=transparent   W=wing-outline (near-black)   w=wing-shade
  //   o=orange body   O=orange shade                b/B=black outline
  //   E=white eye     L=cream belly                 l=belly shade
  //   D=tail shadow   F=flame yellow                R=flame red core
  //
  // Frame A: wings raised, fully spread (top of the flap arc)
  const FRAME_A = [
    "......................",
    ".......W..........bb..",
    "......WoW........boob.",
    ".....WoooW......boooob",
    "....WoooooW....booooob",
    "...WoooooooW..booooEob",
    "..WoooooooooWoooooooooB",
    "..Wwwwwwwwww oooooooooB",
    ".WWwwwwwwwwoollllllooBb",
    "..wwwoooooLLLLLLLLLLoo",
    "...wooooLLLLLLLLLLLLLO",
    "...DoooLLLLLLLLLLLLLO.",
    "..DDooooooLLLLLLLLLO..",
    ".DFooooooooooLLLLO....",
    "DFFoooooooooo.........",
    "FRFooooo..............",
    ".RF...................",
  ];

  // Frame B: wings pulled down/in (bottom of the flap arc)
  const FRAME_B = [
    "......................",
    "..................bb..",
    ".................boob.",
    "................boooob",
    "...............booooob",
    "...wwwwwww....booooEob",
    "..WWwwwwwwwWoooooooooB",
    ".WWooooooooooooooooooB",
    "..WoooooooooollllllooB",
    "...woooooLLLLLLLLLLooo",
    "....oooLLLLLLLLLLLLLLO",
    "...DoooLLLLLLLLLLLLLO.",
    "..DDooooooLLLLLLLLLO..",
    ".DFooooooooooLLLLO....",
    "DFFoooooooooo.........",
    "FRFooooo..............",
    ".RF...................",
  ];

  const PAL = {
    ".": null, " ": null,
    W: "#3a1604",   // wing — dark brown
    w: "#1f0a02",   // wing shade
    o: "#ff6d00",   // bright orange
    O: "#c44d12",   // orange shade
    b: "#000000",
    B: "#000000",
    E: "#ffffff",
    L: "#ffd180",
    l: "#c98a4f",
    D: "#3a1604",
    F: "#ffeb3b",
    R: "#ff3d00",
  };

  const W = 22;
  const H = FRAME_A.length;

  function buildFrame(rows, pxSize) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W * pxSize);
    svg.setAttribute("height", H * pxSize);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.style.display = "block";
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length && x < W; x++) {
        const fill = PAL[row[x]];
        if (!fill) continue;
        const r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("x", x);
        r.setAttribute("y", y);
        r.setAttribute("width", 1);
        r.setAttribute("height", 1);
        r.setAttribute("fill", fill);
        svg.appendChild(r);
      }
    });
    return svg;
  }

  // Returns a wrapper containing both frames, stacked, with CSS-driven alternation.
  function build(pxSize) {
    const box = document.createElement("div");
    box.className = "ch-flapper";
    box.style.position = "relative";
    box.style.display = "inline-block";
    box.style.lineHeight = "0";
    box.style.width = W * pxSize + "px";
    box.style.height = H * pxSize + "px";

    const a = buildFrame(FRAME_A, pxSize);
    a.classList.add("ch-frame-a");
    const b = buildFrame(FRAME_B, pxSize);
    b.classList.add("ch-frame-b");
    [a, b].forEach((s) => {
      s.style.position = "absolute";
      s.style.left = "0";
      s.style.top = "0";
    });

    box.appendChild(a);
    box.appendChild(b);
    return box;
  }

  function buildFlame(pxSize) {
    const FLAME = [
      "..F..",
      ".FRF.",
      "FRRRF",
      "FRRRF",
      ".FRF.",
      "..R..",
    ];
    const FPAL = { ".": null, F: "#ffd54f", R: "#ff3d00" };
    const fw = 5, fh = FLAME.length;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${fw} ${fh}`);
    svg.setAttribute("width", fw * pxSize);
    svg.setAttribute("height", fh * pxSize);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.style.display = "inline-block";
    svg.style.verticalAlign = "middle";
    FLAME.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const fill = FPAL[row[x]];
        if (!fill) continue;
        const r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("x", x);
        r.setAttribute("y", y);
        r.setAttribute("width", 1);
        r.setAttribute("height", 1);
        r.setAttribute("fill", fill);
        svg.appendChild(r);
      }
    });
    return svg;
  }

  return { build, buildFlame, W, H };
})();

/* =========================================================================
   Decorate the page with pixel-art Charizard accents:
   - Hero sprite floating beside the H1
   - Small flame icons on section numbers
   - Footer Charizard
   ========================================================================= */
(function decorate() {
  // Shared style for inline decorations + ambient companion.
  const style = document.createElement("style");
  style.textContent = `
/* Two-frame wing flap — alternate visibility of FRAME_A and FRAME_B */
.ch-flapper .ch-frame-a,
.ch-flapper .ch-frame-b {
  position: absolute; top: 0; left: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
@keyframes chFrameToggle {
  0%, 49.99%   { opacity: 1; }
  50%, 100%    { opacity: 0; }
}
.ch-flapper .ch-frame-a { animation: chFrameToggle 0.44s infinite; }
.ch-flapper .ch-frame-b { animation: chFrameToggle 0.44s infinite; animation-delay: 0.22s; }

.ch-hero {
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.9rem;
  filter: drop-shadow(0 4px 14px rgba(255,100,0,0.3));
  animation: chHover 3.2s ease-in-out infinite;
}
@keyframes chHover {
  0%,100% { transform: translateY(0) rotate(-2deg); }
  50%     { transform: translateY(-8px) rotate(2deg); }
}

.ch-mini {
  display: inline-block;
  vertical-align: middle;
  margin-right: 0.55rem;
  position: relative;
  top: -1px;
}
.ch-mini svg {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: chFlick 0.22s steps(2) infinite;
}
@keyframes chFlick {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(1.15) scaleX(0.9); }
}

.ch-footer {
  display: block;
  margin-top: 1.5rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.ch-footer:hover { opacity: 1; }

/* Ambient companion */
#ch-amb {
  position: fixed;
  bottom: 32px; right: 28px;
  z-index: 9000;
  pointer-events: auto; cursor: pointer;
  opacity: 1;
  filter: drop-shadow(0 8px 22px rgba(0,0,0,0.4)) drop-shadow(0 0 32px rgba(255,120,0,0.35));
  transition: opacity 0.4s ease;
}

.ch-puff {
  position: fixed; width: 14px; height: 14px;
  pointer-events: none; z-index: 8999; border-radius: 50%;
  background: radial-gradient(circle, #fff8d6 0%, #ffd54f 30%, #ff6d00 70%, #d62b00 100%);
  animation: chPuff 1s ease-out forwards;
  mix-blend-mode: screen;
}
@keyframes chPuff {
  0%   { opacity: 0; transform: scale(0.25); }
  20%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(2.6) translate(80px, -30px); }
}

@media (max-width: 540px) {
  #ch-amb { transform: scale(0.65) !important; transform-origin: bottom right; bottom: 16px; right: 12px; }
  .ch-hero { display: none; }
}
`;
  document.head.appendChild(style);

  // 1. HERO sprite beside the H1
  const h1 = document.querySelector(".intro h1");
  if (h1) {
    const hero = document.createElement("span");
    hero.className = "ch-hero";
    hero.setAttribute("aria-hidden", "true");
    hero.appendChild(CHARIZARD.build(6)); // 22*6 = 132px wide
    h1.appendChild(hero);
  }

  // 2. Flame icon prefix on every numbered section header
  document.querySelectorAll("section:not(.intro) h2").forEach((h2) => {
    const mini = document.createElement("span");
    mini.className = "ch-mini";
    mini.setAttribute("aria-hidden", "true");
    mini.appendChild(CHARIZARD.buildFlame(3)); // 15×18 px
    h2.insertBefore(mini, h2.firstChild);
  });

  // 3. Footer sprite
  const footerP = document.querySelector(".site-footer p");
  if (footerP) {
    const fc = document.createElement("span");
    fc.className = "ch-footer";
    fc.setAttribute("aria-hidden", "true");
    fc.appendChild(CHARIZARD.build(4)); // 22*4 = 88px wide
    footerP.parentNode.appendChild(fc);
  }
})();

/* =========================================================================
   Ambient companion — flies around with scroll, breathes fire on scroll.
   ========================================================================= */
(function ambient() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const wrap = document.createElement("div");
  wrap.id = "ch-amb";
  wrap.setAttribute("aria-hidden", "true");
  wrap.appendChild(CHARIZARD.build(8)); // 22*8 = 176px wide
  document.body.appendChild(wrap);

  let curX = 0, curY = 0;
  let tgtX = 0, tgtY = 0;
  let scrolling = false;
  let scrollStop = null;
  let lastPuff = 0;
  let dismissed = false;

  function recalcTarget() {
    const s = window.scrollY;
    tgtX = -Math.sin(s * 0.0042) * 180;
    tgtY = -Math.cos(s * 0.0036) * 90;
  }

  function spawnPuff() {
    const r = wrap.getBoundingClientRect();
    const mx = r.right - 12;
    const my = r.top + r.height * 0.28;
    const p = document.createElement("div");
    p.className = "ch-puff";
    p.style.left = mx + (Math.random() - 0.5) * 10 + "px";
    p.style.top = my + (Math.random() - 0.5) * 10 + "px";
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

  wrap.addEventListener("click", () => {
    if (dismissed) return;
    dismissed = true;
    wrap.style.transition = "transform 1.4s cubic-bezier(0.5,0,1,0.5), opacity 1.4s ease";
    wrap.style.transform = `translate(${window.innerWidth + 280}px, -${window.innerHeight * 0.55}px) rotate(-22deg) scale(1.15)`;
    wrap.style.opacity = "0";
    for (let i = 0; i < 12; i++) setTimeout(spawnPuff, i * 55);
    setTimeout(() => { wrap.remove(); }, 1450);
  });

  let prevX = 0, prevY = 0;
  function tick() {
    if (dismissed) return;
    const dx = (tgtX - curX) * 0.045;
    const dy = (tgtY - curY) * 0.045;
    curX += dx;
    curY += dy;
    const t = performance.now() / 720;
    const bobX = Math.sin(t) * 3.5;
    const bobY = Math.cos(t * 1.2) * 2.5;
    // Tilt toward movement direction — clamp so it doesn't go upside-down
    const vx = curX - prevX;
    const tilt = Math.max(-12, Math.min(12, vx * 6));
    prevX = curX; prevY = curY;
    wrap.style.transform = `translate(${curX + bobX}px, ${curY + bobY}px) rotate(${tilt}deg)`;
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
   Konami code easter egg — same sprite, scaled to 220×170 px, flies across.
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
#char-root { position: fixed; inset: 0; z-index: 9999; pointer-events: auto; cursor: pointer; overflow: hidden; }
.c-flash { position: fixed; inset: 0; pointer-events: none; animation: cFlash 0.65s ease-out both; }
@keyframes cFlash {
  0%   { background: rgba(255,90,0,0); }
  18%  { background: rgba(255,90,0,0.65); }
  40%  { background: rgba(255,255,255,0.85); }
  65%  { background: rgba(255,90,0,0.3); }
  100% { background: rgba(255,90,0,0); }
}
.c-wrap { position: fixed; bottom: 24vh; pointer-events: none;
  animation: cFly 2.5s cubic-bezier(0.2,0.65,0.45,0.95) 0.3s both; }
@keyframes cFly {
  from { transform: translateX(calc(100vw + 130px)); }
  to   { transform: translateX(-280px); }
}
.c-big { filter: drop-shadow(0 0 16px #ff6d00) drop-shadow(0 0 40px rgba(255,100,0,0.5)); }
.c-big svg { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
.cf { position: fixed; pointer-events: none; font-size: 26px;
  animation: cFire 1.15s ease-out both; }
@keyframes cFire {
  0%   { transform: scale(0.3) translateY(0); opacity: 0; }
  25%  { opacity: 1; }
  60%  { transform: scale(1.5) translateY(-22px); opacity: 1; }
  100% { transform: scale(0.9) translateY(-44px); opacity: 0; }
}
.c-dialog { position: fixed; bottom: 5vh; left: 50%; transform: translateX(-50%);
  background: var(--bg, #fbfaf7); border: 2px solid var(--fg, #161514);
  border-radius: 4px; box-shadow: 4px 4px 0 var(--fg, #161514);
  padding: 0.85rem 1.35rem; min-width: 270px; max-width: 88vw;
  font-family: var(--font-mono, ui-monospace, monospace);
  pointer-events: none; animation: cDialog 0.28s ease-out 0.65s both; }
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
