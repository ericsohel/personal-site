/**
 * The $ERIC market — live order book demo.
 * Imports the exact engine.js the repo ships; bots provide liquidity;
 * the visitor (and the site terminal, via window.obApi) trades against them.
 */
import { OrderBook } from "/orderbook/engine.js";
import { MarketMaker, NoiseTrader } from "/orderbook/bots.js";

const root = document.getElementById("ob");
if (root) {
  const book = new OrderBook();
  const mm = new MarketMaker(book, { fair: 10000 });
  const noise = new NoiseTrader(book);

  const statsEl = document.getElementById("ob-stats");
  const canvas = document.getElementById("ob-depth");
  const tapeEl = document.getElementById("ob-tape");
  const form = document.getElementById("ob-form");
  const buyBtn = document.getElementById("ob-buy");
  const sellBtn = document.getElementById("ob-sell");
  const typeSel = document.getElementById("ob-type");
  const priceIn = document.getElementById("ob-price");
  const qtyIn = document.getElementById("ob-qty");
  const cancelBtn = document.getElementById("ob-cancel");
  const msgEl = document.getElementById("ob-msg");

  // ── user state ─────────────────────────────────────────────────────────────
  let userN = 0;
  const myIds = new Set();
  let position = 0; // shares, signed
  let cash = 0;     // cents, signed
  let side = "buy";

  const $ = (t) => "$" + (t / 100).toFixed(2);

  const tape = [];
  book.onTrade = (t) => {
    tape.unshift({ ...t, at: new Date() });
    if (tape.length > 7) tape.pop();
    const mineAsTaker = String(t.takerId).startsWith("you-");
    const mineAsMaker = String(t.makerId).startsWith("you-");
    if (mineAsTaker || mineAsMaker) {
      const mySide = mineAsTaker ? t.takerSide : t.takerSide === "buy" ? "sell" : "buy";
      position += mySide === "buy" ? t.qty : -t.qty;
      cash += mySide === "buy" ? -t.qty * t.price : t.qty * t.price;
    }
  };

  // ── rendering ──────────────────────────────────────────────────────────────
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function renderStats() {
    const bid = book.bestBid(), ask = book.bestAsk(), mid = book.mid();
    const last = book.lastTrade;
    const upnl = mid === null ? 0 : cash + position * mid;
    const rows = [
      ["bid", bid === null ? "—" : $(bid)],
      ["ask", ask === null ? "—" : $(ask)],
      ["last", last ? $(last.price) : "—"],
      ["spread", book.spread() === null ? "—" : (book.spread() / 100).toFixed(2)],
      ["your pos", (position > 0 ? "+" : "") + position],
      ["uPnL", (upnl >= 0 ? "+" : "−") + "$" + Math.abs(upnl / 100).toFixed(2)],
    ];
    statsEl.textContent = "";
    rows.forEach(([k, v]) => {
      const cell = document.createElement("span");
      const key = document.createElement("em");
      key.textContent = k;
      cell.appendChild(key);
      cell.appendChild(document.createTextNode(" " + v));
      if (k === "uPnL") cell.className = upnl >= 0 ? "ob-up" : "ob-down";
      statsEl.appendChild(cell);
    });
  }

  function renderTape() {
    tapeEl.textContent = "";
    tape.forEach((t) => {
      const row = document.createElement("div");
      row.className = "ob-trade " + (t.takerSide === "buy" ? "ob-up" : "ob-down");
      const time = t.at.toTimeString().slice(0, 8);
      row.textContent =
        time + "  " + (t.takerSide === "buy" ? "BUY " : "SELL") + " " +
        String(t.qty).padStart(2) + " @ " + $(t.price) +
        (String(t.takerId).startsWith("you-") || String(t.makerId).startsWith("you-") ? "  ← you" : "");
      tapeEl.appendChild(row);
    });
  }

  function renderDepth() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const mid = book.mid();
    if (mid === null) return;
    const SPAN = 30; // ticks each side of mid
    const x = (price) => ((price - (mid - SPAN)) / (2 * SPAN)) * w;

    const accent = css("--accent") || "#c44d12";
    const fg = css("--fg") || "#161514";
    const muted = css("--muted") || "#6f6c66";

    const drawSide = (levels, color) => {
      let cum = 0;
      const pts = [];
      for (const [price, qty] of levels) {
        if (price < mid - SPAN || price > mid + SPAN) break;
        pts.push([x(price), cum]);   // step up at the level
        cum += qty;
        pts.push([x(price), cum]);
      }
      if (!pts.length) return 0;
      const maxCum = cum;
      return { pts, maxCum, color };
    };

    const bids = drawSide(book.depth(20).bids, accent);
    const asks = drawSide(book.depth(20).asks, muted);
    const maxCum = Math.max(bids ? bids.maxCum : 0, asks ? asks.maxCum : 0, 1);
    const y = (c) => h - 6 - (c / maxCum) * (h - 18);

    for (const sideData of [bids, asks]) {
      if (!sideData) continue;
      const { pts, color } = sideData;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], y(0));
      pts.forEach(([px, c]) => ctx.lineTo(px, y(c)));
      ctx.lineTo(pts[pts.length - 1][0], y(0));
      ctx.closePath();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pts.forEach(([px, c], i) => (i ? ctx.lineTo(px, y(c)) : ctx.moveTo(px, y(c))));
      ctx.stroke();
    }

    // mid line + label
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x(mid), 4);
    ctx.lineTo(x(mid), h - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = muted;
    ctx.font = "10px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText($(Math.round(mid)) + " mid", x(mid), 12);
  }

  function renderAll() {
    renderStats();
    renderTape();
    renderDepth();
    const resting = [...myIds].filter((id) => book.locate.has(id)).length;
    cancelBtn.textContent = "cancel mine (" + resting + ")";
  }

  // ── user actions ───────────────────────────────────────────────────────────
  function setSide(s) {
    side = s;
    buyBtn.classList.toggle("is-sel", s === "buy");
    sellBtn.classList.toggle("is-sel", s === "sell");
    const ref = s === "buy" ? book.bestBid() : book.bestAsk();
    if (ref !== null && typeSel.value === "limit") priceIn.value = (ref / 100).toFixed(2);
  }
  buyBtn.addEventListener("click", () => setSide("buy"));
  sellBtn.addEventListener("click", () => setSide("sell"));
  typeSel.addEventListener("change", () => {
    priceIn.disabled = typeSel.value === "market";
  });

  function placeOrder(s, type, priceTicks, qty) {
    const id = "you-" + userN++;
    const res = book.submit({ id, side: s, type, price: priceTicks, qty });
    if (res.restedQty > 0) myIds.add(id);
    const filled = res.fills.reduce((n, f) => n + f.qty, 0);
    const notional = res.fills.reduce((n, f) => n + f.qty * f.price, 0);
    let m = "";
    if (filled) m += "filled " + filled + " @ avg " + $(Math.round(notional / filled));
    if (res.restedQty) m += (m ? " · " : "") + "resting " + res.restedQty + (type === "limit" ? " @ " + $(priceTicks) : "");
    if (!m) m = "nothing filled — book is empty there";
    return m;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const type = typeSel.value;
      const qty = Math.floor(Number(qtyIn.value));
      const priceTicks = Math.round(Number(priceIn.value) * 100);
      msgEl.textContent = placeOrder(side, type, type === "limit" ? priceTicks : undefined, qty);
    } catch (err) {
      msgEl.textContent = err.message;
    }
    renderAll();
  });

  cancelBtn.addEventListener("click", () => {
    let n = 0;
    for (const id of myIds) if (book.cancel(id)) n++;
    myIds.clear();
    msgEl.textContent = n ? "cancelled " + n : "nothing resting";
    renderAll();
  });

  // Terminal integration: `buy 5` / `sell 3` trade this market.
  window.obApi = {
    marketOrder(s, qty) {
      const m = placeOrder(s, "market", undefined, qty);
      renderAll();
      const mid = book.mid();
      const upnl = mid === null ? 0 : cash + position * mid;
      return m + " · position " + (position > 0 ? "+" : "") + position +
        " · uPnL " + (upnl >= 0 ? "+" : "−") + "$" + Math.abs(upnl / 100).toFixed(2);
    },
  };

  // ── market loop: run only while visible ───────────────────────────────────
  let visible = false;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }).observe(root);

  for (let i = 0; i < 3; i++) mm.step(); // seed the book
  noise.aggression = 0.45;
  renderAll();

  setInterval(() => {
    if (!visible || document.hidden) return;
    mm.step();
    noise.step();
    renderAll();
  }, 550);

  setSide("buy");
}
