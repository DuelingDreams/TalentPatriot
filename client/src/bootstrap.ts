window.addEventListener("error", (e:any) => {
  console.error("WindowError", e?.error || e?.message || e);
});
window.addEventListener("unhandledrejection", (e:any) => {
  console.error("UnhandledPromise", e?.reason || e);
});