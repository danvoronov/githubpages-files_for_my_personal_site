document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || event.defaultPrevented) return;

  event.preventDefault();
  if (history.length > 1) {
    history.back();
  } else {
    window.location.assign("../");
  }
});
