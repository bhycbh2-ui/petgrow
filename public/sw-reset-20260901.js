// One-release compatibility helper for clients controlled by older PetGrow service workers.
// Loaded from index.html with a cache-busting URL. It asks any waiting/active worker
// to activate immediately and purge its Cache Storage, then reloads once when the
// controller changes so the current network-first worker takes control.
(() => {
  if (!("serviceWorker" in navigator)) return;

  const FLAG = "petgrow_sw_reset_20260901";

  const sendReset = (worker) => {
    try { worker?.postMessage({ type: "CLEAR_PETGROW_CACHES" }); } catch {}
    try { worker?.postMessage({ type: "SKIP_WAITING" }); } catch {}
  };

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (!registration) return;
    sendReset(registration.waiting);
    sendReset(registration.active);
    registration.update().catch(() => {});
  }).catch(() => {});

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, "1");
    location.reload();
  });
})();
