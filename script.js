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
