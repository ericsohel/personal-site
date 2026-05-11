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

// ↑↑↓↓←→←→BA
(function charizard() {
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

    // Inject CSS once
    const style = document.createElement("style");
    style.id = "char-css";
    style.textContent = css();
    document.head.appendChild(style);

    // Fire particles timed to dragon's path (right → left over 2.5s, 0.3s delay)
    // Dragon at position p% from left at t = (1 - p/100) * 2.5 + 0.3
    const fires = Array.from({ length: 11 }, (_, i) => {
      const p = 8 + i * 8;                              // 8, 16, 24 … 88 (% from left)
      const d = ((1 - p / 100) * 2.5 + 0.3).toFixed(2); // delay: fires right-to-left
      const b = (16 + Math.random() * 10).toFixed(1);   // vertical scatter
      return `<span class="cf" style="left:${p}%;bottom:${b}vh;animation-delay:${d}s">🔥</span>`;
    }).join("");

    const el = document.createElement("div");
    el.id = "char-root";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="c-flash"></div>
      <div class="c-wrap"><div class="c-dragon">🐉</div></div>
      ${fires}
      <div class="c-dialog">
        <p class="c-l1"></p>
        <p class="c-l2"></p>
      </div>`;
    document.body.appendChild(el);

    type(el.querySelector(".c-l1"), "A wild CHARIZARD appeared!", () =>
      setTimeout(() =>
        type(el.querySelector(".c-l2"), "🔥  It's super effective!"), 200));

    const exit = () => {
      el.style.transition = "opacity 0.35s ease";
      el.style.opacity = "0";
      el.addEventListener("transitionend", () => {
        el.remove();
        style.remove();
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
.c-flash {
  position: fixed; inset: 0; pointer-events: none;
  animation: cFlash 0.65s ease-out both;
}
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
  to   { transform: translateX(-170px); }
}
.c-dragon {
  font-size: 96px; line-height: 1;
  transform: scaleX(-1);
  filter: drop-shadow(0 0 16px #ff6d00) drop-shadow(0 0 36px rgba(255,100,0,0.45));
}
.cf {
  position: fixed; pointer-events: none; font-size: 26px;
  animation: cFire 1.15s ease-out both;
}
@keyframes cFire {
  0%   { transform: scale(0.3) translateY(0px); opacity: 0; }
  25%  { opacity: 1; }
  60%  { transform: scale(1.5) translateY(-22px); opacity: 1; }
  100% { transform: scale(0.9) translateY(-44px); opacity: 0; }
}
.c-dialog {
  position: fixed; bottom: 5vh;
  left: 50%; transform: translateX(-50%);
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
.c-dialog p {
  margin: 0 0 0.2rem; font-size: 0.88rem;
  color: var(--fg, #161514); min-height: 1.4em;
}
.c-dialog p:last-child { margin: 0; }
.c-l1 { font-weight: 600; }
    `;
  }
})();
