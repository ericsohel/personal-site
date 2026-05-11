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
  // Frame A — wings up, fully spread.
  // 22 cols × 17 rows. Every row exactly 22 chars.
  const FRAME_A = [
    "....W.................",
    "...WwW...........bbb..",
    "..WwwwW.........bOOOb.",
    "..WwwwwW........bOOOOb",
    ".WwwwwwwW......bOEoOOb",
    ".WwwwwwwwW....bOoooobb",
    "WwwwwwwwwwWooboooooooB",
    ".WWwwwwwwwoooooooooooB",
    "..WWWWWooooollllllooOB",
    "...oooooLLLLLLLLLLLOOB",
    "..DooooLLLLLLLLLLLLLO.",
    ".DDooooLLLLLLLLLLLLO..",
    ".DFoooooooLLLLLLLLO...",
    "DFFooooooooooLLLLO....",
    "FRFoooooooooo.........",
    ".RFooooo..............",
    "..F...................",
  ];

  // Frame B — wings tucked down (mid-stroke). Body stays put; only the wings move.
  const FRAME_B = [
    "......................",
    "..................bbb.",
    ".................bOOOb",
    "................bOOOOb",
    "...............bOEoOOb",
    "..............bOoooobb",
    "..............booooooB",
    "....WwwwwwooooooooooooB",
    "...WwwwwwooollllllooOB",
    "..WWwwwooLLLLLLLLLLLOB",
    "..wwwwoLLLLLLLLLLLLLLO",
    ".DwwooooLLLLLLLLLLLLO.",
    ".DDoooooooLLLLLLLLO...",
    "DFFooooooooooLLLLO....",
    "FRFoooooooooo.........",
    ".RFooooo..............",
    "..F...................",
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
   Single hero sprite beside the H1. Click to send it flying off the page.
   ========================================================================= */
(function hero() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const style = document.createElement("style");
  style.textContent = `
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
.ch-flapper .ch-frame-a { animation: chFrameToggle 0.42s infinite; }
.ch-flapper .ch-frame-b { animation: chFrameToggle 0.42s infinite; animation-delay: 0.21s; }

.ch-hero {
  display: inline-block;
  vertical-align: middle;
  margin-left: 1rem;
  cursor: pointer;
  filter: drop-shadow(0 4px 14px rgba(255,100,0,0.28));
  transition: filter 0.18s ease;
  animation: chHover 3.4s ease-in-out infinite;
}
.ch-hero:hover { filter: drop-shadow(0 4px 18px rgba(255,140,0,0.55)); }
@keyframes chHover {
  0%,100% { transform: translateY(0) rotate(-1.5deg); }
  50%     { transform: translateY(-7px) rotate(1.5deg); }
}
.ch-hero.flying {
  animation: none;
  transition: transform 1.6s cubic-bezier(0.55, 0, 0.9, 0.4), opacity 1.6s ease;
  pointer-events: none;
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
  .ch-hero { display: none; }
}
`;
  document.head.appendChild(style);

  const h1 = document.querySelector(".intro h1");
  if (!h1) return;

  const hero = document.createElement("span");
  hero.className = "ch-hero";
  hero.setAttribute("role", "button");
  hero.setAttribute("tabindex", "0");
  hero.setAttribute("aria-label", "Pet the dragon");
  hero.title = "click to fly off";
  hero.appendChild(CHARIZARD.build(7)); // 22 * 7 = 154px wide
  h1.appendChild(hero);

  function spawnPuff(originX, originY) {
    const p = document.createElement("div");
    p.className = "ch-puff";
    p.style.left = originX + (Math.random() - 0.5) * 14 + "px";
    p.style.top = originY + (Math.random() - 0.5) * 14 + "px";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }

  let flown = false;
  function flyOff() {
    if (flown) return;
    flown = true;
    const r = hero.getBoundingClientRect();
    const mouthX = r.right - 10;
    const mouthY = r.top + r.height * 0.35;
    for (let i = 0; i < 14; i++) setTimeout(() => spawnPuff(mouthX, mouthY), i * 55);
    hero.classList.add("flying");
    hero.style.opacity = "0";
    hero.style.transform = `translate(${window.innerWidth - r.left + 100}px, -${r.top + 120}px) rotate(-18deg) scale(1.25)`;
    setTimeout(() => hero.remove(), 1600);
  }

  hero.addEventListener("click", flyOff);
  hero.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flyOff(); }
  });

  if (reduceMotion) {
    hero.style.animation = "none";
  }
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
