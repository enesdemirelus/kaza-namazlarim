(function () {
  try {
    var t = localStorage.getItem("theme") || "light";
    if (t === "system") {
      t = window.matchMedia("(prefers-color-scheme:dark)").matches
        ? "dark"
        : "light";
    }
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
  } catch (e) {}
  try {
    var c = localStorage.getItem("accent-color") || "green";
    document.documentElement.setAttribute("data-color", c);
  } catch (e) {}
})();
