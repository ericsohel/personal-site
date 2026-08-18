/**
 * A limit order book with price-time priority matching.
 *
 * Zero dependencies; ES module — the same file runs in Node and the browser.
 * Prices are integers (ticks); quantities are positive integers.
 *
 * Invariants:
 *  - Price priority: better-priced resting orders always fill first.
 *  - Time priority: within a price level, strict FIFO by arrival.
 *  - Price improvement: every trade executes at the resting (maker) price.
 *
 * Complexity: O(log L) level lookup/insert (binary search over L price
 * levels), O(1) best-of-book, O(1) amortized per fill.
 */
export class OrderBook {
  constructor() {
    this.bids = [];          // levels sorted best-first (descending price)
    this.asks = [];          // levels sorted best-first (ascending price)
    this.locate = new Map(); // orderId -> { side, price } for O(log L) cancel
    this.nextSeq = 0;
    this.lastTrade = null;
    this.onTrade = null;     // optional callback(trade)
  }

  // ── queries ────────────────────────────────────────────────────────────────

  bestBid() { return this.bids.length ? this.bids[0].price : null; }
  bestAsk() { return this.asks.length ? this.asks[0].price : null; }

  spread() {
    const b = this.bestBid(), a = this.bestAsk();
    return b === null || a === null ? null : a - b;
  }

  mid() {
    const b = this.bestBid(), a = this.bestAsk();
    if (b === null && a === null) return this.lastTrade ? this.lastTrade.price : null;
    if (b === null) return a;
    if (a === null) return b;
    return (a + b) / 2;
  }

  /** Aggregated size per price level, best-first: { bids: [[price, qty]], asks: [...] } */
  depth(levels = 10) {
    const take = (book) =>
      book.slice(0, levels).map((l) => [l.price, l.orders.reduce((s, o) => s + o.qty, 0)]);
    return { bids: take(this.bids), asks: take(this.asks) };
  }

  // ── orders ─────────────────────────────────────────────────────────────────

  /**
   * Submit an order. Limit orders match while they cross, then rest.
   * Market orders match what they can and discard the remainder (IOC).
   * Returns { orderId, fills, restedQty }.
   */
  submit({ id, side, type = "limit", price, qty }) {
    if (side !== "buy" && side !== "sell") throw new Error("side must be buy|sell");
    if (!Number.isInteger(qty) || qty <= 0) throw new Error("qty must be a positive integer");
    if (type === "limit" && (!Number.isInteger(price) || price <= 0)) {
      throw new Error("limit orders need a positive integer price");
    }

    const orderId = id ?? "o" + this.nextSeq;
    const seq = this.nextSeq++;
    const against = side === "buy" ? this.asks : this.bids;
    const crosses = (best) =>
      type === "market" || (side === "buy" ? best.price <= price : best.price >= price);

    const fills = [];
    let remaining = qty;

    while (remaining > 0 && against.length && crosses(against[0])) {
      const level = against[0];
      const maker = level.orders[0]; // FIFO: oldest order at the level
      const traded = Math.min(remaining, maker.qty);
      maker.qty -= traded;
      remaining -= traded;

      const trade = {
        price: level.price, // maker price — the taker gets price improvement
        qty: traded,
        takerSide: side,
        makerId: maker.id,
        takerId: orderId,
      };
      fills.push(trade);
      this.lastTrade = trade;
      if (this.onTrade) this.onTrade(trade);

      if (maker.qty === 0) {
        level.orders.shift();
        this.locate.delete(maker.id);
        if (level.orders.length === 0) against.shift();
      }
    }

    let restedQty = 0;
    if (remaining > 0 && type === "limit") {
      this.#rest(side, price, { id: orderId, qty: remaining, seq });
      restedQty = remaining;
    }

    return { orderId, fills, restedQty };
  }

  /** Cancel a resting order by id. Returns true if found and removed. */
  cancel(orderId) {
    const loc = this.locate.get(orderId);
    if (!loc) return false;
    const book = loc.side === "buy" ? this.bids : this.asks;
    const { index, exact } = this.#levelIndex(book, loc.side, loc.price);
    if (!exact) return false;

    const level = book[index];
    const oi = level.orders.findIndex((o) => o.id === orderId);
    if (oi < 0) return false;
    level.orders.splice(oi, 1);
    if (level.orders.length === 0) book.splice(index, 1);
    this.locate.delete(orderId);
    return true;
  }

  // ── internals ──────────────────────────────────────────────────────────────

  #rest(side, price, order) {
    const book = side === "buy" ? this.bids : this.asks;
    const { index, exact } = this.#levelIndex(book, side, price);
    if (exact) book[index].orders.push(order);
    else book.splice(index, 0, { price, orders: [order] });
    this.locate.set(order.id, { side, price });
  }

  /** Binary search over best-first levels: bids descend, asks ascend. */
  #levelIndex(book, side, price) {
    let lo = 0, hi = book.length;
    const before = (a, b) => (side === "buy" ? a > b : a < b);
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (before(book[m].price, price)) lo = m + 1;
      else hi = m;
    }
    return { index: lo, exact: lo < book.length && book[lo].price === price };
  }
}
