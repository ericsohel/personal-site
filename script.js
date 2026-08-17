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

/* Subway life-map — caption follows the hovered/focused/tapped stop. */
(function () {
  const stops = document.querySelectorAll(".subway .stop");
  const cap = document.getElementById("subway-caption");
  if (!stops.length || !cap) return;
  stops.forEach((b) => {
    const show = () => {
      stops.forEach((x) => x.classList.toggle("is-active", x === b));
      cap.textContent = b.dataset.story;
    };
    b.addEventListener("mouseenter", show);
    b.addEventListener("focus", show);
    b.addEventListener("click", show);
  });
})();

/* DraftIQ live demo — fetch shared by the projects widget and the terminal. */
(function () {
  const API = "https://player-data-api.onrender.com/api/v1/demo/valuations";
  const CACHE_KEY = "draftiq-demo-v1";
  const COLD_MSGS = [
    [0, "calling the production API…"],
    [4, "cold start — the free-tier server is waking up…"],
    [12, "still stretching. free-tier naps are real…"],
    [30, "nearly there — Render cold starts can run ~45s…"],
  ];

  let inflight = null;

  function fetchDemo(onProgress) {
    if (inflight) return inflight;
    const started = Date.now();
    let timer = null;
    if (onProgress) {
      timer = setInterval(() => {
        const s = (Date.now() - started) / 1000;
        const msg = [...COLD_MSGS].reverse().find(([t]) => s >= t);
        if (msg) onProgress(msg[1], s);
      }, 1000);
    }
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 75000);
    inflight = fetch(API, { signal: ctrl.signal })
      .then(async (r) => {
        if (r.status === 404) throw Object.assign(new Error("not deployed"), { code: 404 });
        if (!r.ok) throw Object.assign(new Error("unavailable"), { code: r.status });
        const data = await r.json();
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
        return data;
      })
      .finally(() => {
        clearTimeout(timeout);
        if (timer) clearInterval(timer);
        inflight = null;
      });
    return inflight;
  }

  function cached() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (_) { return null; }
  }

  window.draftiqDemo = { fetchDemo, cached };

  // ── Widget wiring ──────────────────────────────────────────────────────────
  const panel = document.getElementById("draftiq-demo");
  const btn = document.getElementById("demo-run");
  const body = document.getElementById("demo-body");
  if (!panel || !btn || !body) return;
  panel.hidden = false;

  function setStatus(text) {
    body.textContent = text;
  }

  function renderTable(data, note) {
    body.textContent = "";
    const tbl = document.createElement("table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    [["#", "num"], ["player", ""], ["value", "num"], ["group", ""]].forEach(([t, cls]) => {
      const th = document.createElement("th");
      th.textContent = t;
      if (cls) th.className = cls;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    tbl.appendChild(thead);
    const tbody = document.createElement("tbody");
    (data.top || []).slice(0, 5).forEach((p) => {
      const tr = document.createElement("tr");
      [[p.rank, "num"], [p.name, ""], ["$" + p.dollarValue, "num"], [p.statGroup, ""]].forEach(([t, cls]) => {
        const td = document.createElement("td");
        td.textContent = t;
        if (cls) td.className = cls;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    body.appendChild(tbl);
    const meta = document.createElement("div");
    meta.className = "demo-meta";
    const when = data.computedAt ? new Date(data.computedAt).toLocaleString() : "unknown";
    meta.textContent =
      (note ? note + " · " : "") +
      "computed " + when + " · " + (data.playerCount || "?") + " players ranked · top 5 of " +
      (data.top ? data.top.length : 0) + " shown — terminal shows all 10";
    body.appendChild(meta);
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const c = cached();
    if (c) renderTable(c, "cached copy while refreshing");
    else setStatus("calling the production API…");
    try {
      const data = await fetchDemo((m) => { if (!c) setStatus(m); });
      renderTable(data);
      panel.classList.add("is-live");
      btn.textContent = "refresh";
    } catch (err) {
      panel.classList.remove("is-live");
      if (err.code === 404) {
        setStatus("demo endpoint isn't deployed yet (branch awaiting merge) — meanwhile the developer portal above is fully live.");
      } else if (err.name === "AbortError") {
        setStatus("timed out after 75s — the free-tier server is napping hard. worth one more try.");
      } else {
        setStatus("couldn't reach the API (" + (err.code || err.message) + "). try again in a minute.");
      }
    } finally {
      btn.disabled = false;
    }
  });
})();

/* On Repeat — live Spotify via /api/now-playing (Vercel function). */
(function () {
  const wrap = document.getElementById("spotify");
  if (!wrap) return;
  const np = document.getElementById("np");
  const art = document.getElementById("np-art");
  const eq = document.getElementById("np-eq");
  const label = document.getElementById("np-label");
  const track = document.getElementById("np-track");
  const artist = document.getElementById("np-artist");
  const recentEl = document.getElementById("np-recent");
  const pending = document.getElementById("spotify-pending");

  function load() {
    return fetch("/api/now-playing").then((r) => {
      if (!r.ok) throw Object.assign(new Error("unavailable"), { code: r.status });
      return r.json();
    });
  }
  window.spotifyNow = { load };

  function render(d) {
    if (!d.track && !(d.recent || []).length) {
      pending.textContent = "nothing on the turntable lately.";
      return;
    }
    if (d.track) {
      np.hidden = false;
      if (d.track.art) {
        art.src = d.track.art;
        art.hidden = false;
      }
      label.textContent = d.playing ? "now playing" : "last played";
      eq.classList.toggle("live", !!d.playing);
      track.textContent = d.track.name;
      if (d.track.url) track.href = d.track.url;
      artist.textContent = d.track.artist;
    }
    if ((d.recent || []).length) {
      recentEl.hidden = false;
      recentEl.textContent = "";
      d.recent.forEach((t) => {
        const li = document.createElement("li");
        if (t.url) {
          const a = document.createElement("a");
          a.href = t.url;
          a.rel = "noopener";
          a.textContent = t.name + " — " + t.artist;
          li.appendChild(a);
        } else {
          li.textContent = t.name + " — " + t.artist;
        }
        recentEl.appendChild(li);
      });
    }
    pending.hidden = true;
  }

  // Silent on failure — the pending note already explains itself.
  load().then(render).catch(() => {});
})();

/* Terminal — progressive enhancement; the box stays hidden without JS. */
(function () {
  const wrap = document.getElementById("terminal");
  const out = document.getElementById("term-out");
  const input = document.getElementById("term-in");
  if (!wrap || !out || !input) return;
  wrap.hidden = false;

  const PROMPT = "eric@nyc:~$";
  const SECTIONS = ["about", "ride", "experience", "projects", "skills", "awards", "books", "repeat", "contact"];
  const history = [];
  let hIdx = -1;

  const esc = (s) =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function print(html, cls) {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.innerHTML = html;
    out.appendChild(div);
    while (out.children.length > 120) out.removeChild(out.firstChild);
    out.scrollTop = out.scrollHeight;
  }

  function jump(name) {
    const h = document.getElementById(name + "-h");
    if (!h) return print("no such section: " + esc(name), "muted");
    h.closest("section").scrollIntoView({ behavior: "smooth", block: "start" });
    print("→ #" + name, "muted");
  }

  const link = (href, text) =>
    '<a href="' + href + '">' + (text || href.replace(/^https?:\/\//, "")) + "</a>";

  const COMMANDS = {
    help() {
      print(
        [
          "whoami       who is this guy",
          "demo         run draftiq live, against the real production api",
          "nowplaying   what's in my headphones (live)",
          "projects     what i've built",
          "experience   where i've worked",
          "awards       the trophy shelf",
          "contact      say hi",
          "github       both of them — long story",
          "resume       (it's on request)",
          "theme        lights on / off",
          "ls           list sections — type a name to jump to it",
          "clear        wipe the screen",
        ].join("\n")
      );
    },
    whoami() {
      print(
        "eric sohel — cs & applied math @ stony brook ('27)\n" +
          "backend systems, multi-agent AI, security tooling\n" +
          "fantasy-baseball auction theorist · nyc"
      );
    },
    projects() {
      print(
        "draftiq — production REST API for fantasy baseball auction drafting\n" +
          "  600+ live player valuations in tens of ms · 125 tests\n" +
          "  " + link("https://player-data-api.onrender.com/developer-portal/", "developer portal") +
          " · " + link("https://github.com/ericsohel/player-data-api", "source") + "\n" +
          "pysa harness — differential testing for Meta's static analyzer\n" +
          "  10k+ synthesized programs with ground-truth taint labels\n" +
          "  " + link("https://github.com/facebook/pyre-check/pull/886", "pyre-check#886")
      );
    },
    experience() {
      print(
        "2026  capital one, nyc — multi-agent financial reporting (langgraph)\n" +
          "2025  capital one, mclean — first in-house wire transfer platform\n" +
          "2024  meta (mlh fellowship) — pysa static analyzer\n" +
          "2024  stanford code in place — section leader → head TA\n" +
          "(`cd experience` jumps to the full writeups — i worked hard on that layout)"
      );
    },
    awards() {
      print(
        "citadel terminal — 2nd place\n" +
          "cornell trading competition — top 5 (×2)\n" +
          "AIME qualifier (×2)"
      );
    },
    contact() {
      print(
        link("mailto:ericsohel05@gmail.com", "ericsohel05@gmail.com") +
          "\n" + link("https://github.com/ericsohel") +
          "\n" + link("https://www.linkedin.com/in/eric-sohel/", "linkedin.com/in/eric-sohel")
      );
    },
    github() {
      print(
        link("https://github.com/ericsohel") + " — where things live now\n" +
          link("https://github.com/esohel30") + " — the old account. my merged PRs into\n" +
          "facebook/pyre-check are under this handle: " +
          link("https://github.com/facebook/pyre-check/pulls?q=esohel30+", "proof")
      );
    },
    resume() {
      print("available on request → " + link("mailto:ericsohel05@gmail.com", "ericsohel05@gmail.com"), "muted");
    },
    theme() {
      document.getElementById("theme-toggle").click();
      const dark = root().dataset.theme === "dark";
      print(dark ? "lights off." : "lights on.", "muted");
    },
    ls() {
      print(SECTIONS.join("  "));
    },
    pwd() {
      print("/home/eric/nyc");
    },
    clear() {
      out.innerHTML = "";
    },
    exit() {
      print("there is no exit. only `clear`.", "muted");
    },
    hello() {
      print("hey! type `help` to look around.");
    },
    demo() {
      if (!window.draftiqDemo) return print("demo module missing — refresh the page?", "muted");
      let lastMsg = "";
      print("draftiq → GET /api/v1/demo/valuations (live, production)", "muted");
      window.draftiqDemo
        .fetchDemo((m) => {
          if (m !== lastMsg) {
            lastMsg = m;
            print(m, "muted");
          }
        })
        .then((data) => {
          const rows = (data.top || []).map(
            (p) =>
              String(p.rank).padStart(2) + "  " +
              String(p.name).slice(0, 22).padEnd(22) + " " +
              ("$" + p.dollarValue).padStart(5) + "  " +
              (p.statGroup || "")
          );
          print(rows.join("\n"));
          print(
            "computed " + (data.computedAt ? new Date(data.computedAt).toLocaleString() : "?") +
              " · " + (data.playerCount || "?") + " players ranked · z-score engine, cached 15m",
            "muted"
          );
        })
        .catch((err) => {
          if (err.code === 404) {
            print("demo endpoint not deployed yet — branch is awaiting merge. the developer portal is live though: type `projects`", "muted");
          } else if (err.name === "AbortError") {
            print("timed out — free-tier server is napping hard. run `demo` once more.", "muted");
          } else {
            print("api unreachable (" + (err.code || err.message) + ") — try again in a minute.", "muted");
          }
        });
    },
    books() {
      jump("books");
    },
    onrepeat() {
      jump("repeat");
    },
    nowplaying() {
      if (!window.spotifyNow) return print("spotify module missing — refresh the page?", "muted");
      print("spotify → GET /api/now-playing", "muted");
      window.spotifyNow
        .load()
        .then((d) => {
          if (d.track) {
            print((d.playing ? "▶ now playing: " : "⏸ last played: ") + d.track.name + " — " + d.track.artist);
            (d.recent || []).forEach((t) => print("  earlier: " + t.name + " — " + t.artist, "muted"));
          } else {
            print("nothing on the turntable lately.", "muted");
          }
        })
        .catch((e) => {
          if (e.code === 404 || e.code === 503) {
            print("spotify isn't wired up yet — env vars pending on vercel (see SPOTIFY-SETUP.md).", "muted");
          } else {
            print("spotify api unreachable — try again later.", "muted");
          }
        });
    },
  };
  COMMANDS.hi = COMMANDS.hello;
  COMMANDS.exp = COMMANDS.experience;
  COMMANDS.draftiq = COMMANDS.demo;
  COMMANDS.spotify = COMMANDS.nowplaying;

  function root() {
    return document.documentElement;
  }

  function run(raw) {
    const line = raw.trim();
    print('<span class="term-prompt">' + PROMPT + "</span> " + esc(raw), "echo");
    if (!line) return;

    const [cmd, ...rest] = line.toLowerCase().split(/\s+/);

    if (cmd === "sudo") return print("nice try.", "muted");
    if (cmd === "cd") return rest[0] ? jump(rest[0]) : print("cd: where to? try `ls`", "muted");
    if (SECTIONS.includes(cmd)) return jump(cmd);
    if (COMMANDS[cmd]) return COMMANDS[cmd]();

    print("command not found: " + esc(cmd) + " — try `help`", "muted");
  }

  function submit() {
    const v = input.value;
    if (v.trim()) {
      history.push(v);
      hIdx = history.length;
    }
    input.value = "";
    run(v);
  }

  document.getElementById("term-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  input.addEventListener("keydown", (e) => {
    // Fallback for environments whose synthesized Enter doesn't trigger
    // implicit form submission (e.key can arrive empty from automation).
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      if (history.length && hIdx > 0) {
        hIdx--;
        input.value = history[hIdx];
        e.preventDefault();
      }
    } else if (e.key === "ArrowDown") {
      if (hIdx < history.length - 1) {
        hIdx++;
        input.value = history[hIdx];
      } else {
        hIdx = history.length;
        input.value = "";
      }
      e.preventDefault();
    }
  });

  wrap.addEventListener("click", () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) return; // let people copy output
    input.focus();
  });

  print("welcome. type `help` to look around.", "muted");
})();
