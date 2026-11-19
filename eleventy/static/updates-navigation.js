document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const backLink = document.querySelector("[data-esc-back]");
  if (!backLink?.href) return;

  event.preventDefault();
  window.location.href = backLink.href;
});
