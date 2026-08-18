/**
 * Demo liquidity for the order book: a market maker quoting around a
 * random-walking fair value, and a noise trader taking liquidity.
 * Used by the live demo on ericsohel.com; not part of the engine.
 */

export class MarketMaker {
  constructor(book, { fair = 10000, halfSpread = 3, levels = 3, prefix = "mm" } = {}) {
    this.book = book;
    this.fair = fair;
    this.halfSpread = halfSpread;
    this.levels = levels;
    this.prefix = prefix;
    this.n = 0;
    this.live = [];
  }

  step() {
    // fair value random-walks a tick or two
    this.fair += Math.round((Math.random() - 0.5) * 4);

    // pull stale quotes, then re-quote both sides
    for (const id of this.live) this.book.cancel(id);
    this.live = [];

    for (let i = 0; i < this.levels; i++) {
      const size = 4 + Math.floor(Math.random() * 8) + i * 3; // deeper = bigger
      const bid = this.fair - this.halfSpread - i * 2;
      const ask = this.fair + this.halfSpread + i * 2;
      for (const [side, price] of [["buy", bid], ["sell", ask]]) {
        const id = this.prefix + this.n++;
        this.book.submit({ id, side, price, qty: size });
        this.live.push(id);
      }
    }
  }
}

export class NoiseTrader {
  constructor(book, { prefix = "nt", aggression = 0.35 } = {}) {
    this.book = book;
    this.prefix = prefix;
    this.aggression = aggression;
    this.n = 0;
  }

  step() {
    if (Math.random() > this.aggression) return;
    const side = Math.random() < 0.5 ? "buy" : "sell";
    const qty = 1 + Math.floor(Math.random() * 6);
    this.book.submit({ id: this.prefix + this.n++, side, type: "market", qty });
  }
}
