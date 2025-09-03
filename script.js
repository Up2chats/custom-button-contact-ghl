<script>
(() => {
  "use strict";

  // ================== Config ==================
  const TARGET_LOCATION = "VnNG56gjYeT9Hp7TCbdy"; // <-- SOLO esta location
  const BTN_ATTR = "data-ghl-headerbtn";
  const ENDPOINT = null; // p.ej. "https://tu-api.com/endpoint"

  // ================== Helpers ==================
  const getLocationId = () => (location.pathname.match(/\/location\/([^/]+)/) || [])[1] || null;
  const getContactId  = () => (location.pathname.match(/\/contacts\/detail\/([^/]+)/) || [])[1] || null;

  // Sólo continúa si la URL es /location/:id/contacts/detail/:contactId y coincide la location
  const urlMatches = () =>
    /\/location\/[^/]+\/contacts\/detail\/[^/]+/.test(location.pathname) &&
    getLocationId() === TARGET_LOCATION;

  // Estilos del botón
  const ensureStyle = () => {
    if (document.getElementById("ghl-headerbtn-style")) return;
    const s = document.createElement("style");
    s.id = "ghl-headerbtn-style";
    s.textContent = `
      .ghl-headerbtn{
        display:inline-flex;align-items:center;justify-content:center;
        padding:6px 10px;font-size:12px;border:none;border-radius:6px;
        background:#2563eb;color:#fff;cursor:pointer;margin-left:6px;
        transition:background .2s ease;
      }
      .ghl-headerbtn:hover{background:#1d4ed8}
      .ghl-headerbtn:active{background:#1e40af}
      .ghl-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.3);display:none;align-items:center;justify-content:center;z-index:9999}
      .ghl-modal{width:100%;max-width:420px;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.15);padding:16px;box-sizing:border-box}
      .ghl-h1{font-weight:600;font-size:15px;margin-bottom:6px}
      .ghl-h2{font-size:12px;color:#667085;margin-bottom:10px}
      .ghl-row{display:grid;gap:8px}
      .ghl-inp{width:100%;height:32px;padding:6px 10px;font-size:13px;border:1px solid #d0d5dd;border-radius:6px;outline:none}
      .ghl-inp:focus{border-color:#98a2b3}
      .ghl-actions{margin-top:12px;display:flex;justify-content:flex-end;gap:8px}
      .ghl-btn{padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;border:none}
      .ghl-btn.primary{background:#2563eb;color:#fff}
      .ghl-btn.primary:hover{background:#1d4ed8}
      .ghl-btn[disabled]{opacity:.6;cursor:not-allowed}
    `;
    document.head.appendChild(s);
  };

  // Modal mínimo (si no usas el de cards)
  const ensureModal = (() => {
    const ID_BACKDROP = "ghl-header-backdrop";
    return function () {
      if (document.getElementById(ID_BACKDROP)) return;
      ensureStyle();
      const bd = document.createElement("div");
      bd.id = ID_BACKDROP;
      bd.className = "ghl-backdrop";
      bd.innerHTML = `
        <div class="ghl-modal" role="dialog" aria-modal="true">
          <div class="ghl-h1">Enviar datos</div>
          <div id="ghl-h2" class="ghl-h2"></div>
          <div class="ghl-row">
            <input id="ghl-i1" class="ghl-inp" placeholder="Campo 1" />
            <input id="ghl-i2" class="ghl-inp" placeholder="Campo 2" />
          </div>
          <div class="ghl-actions">
            <button id="ghl-cancel" class="ghl-btn" type="button">Cancelar</button>
            <button id="ghl-send"   class="ghl-btn primary" type="button">Enviar</button>
          </div>
        </div>`;
      document.body.appendChild(bd);

      const hide = () => (bd.style.display = "none");
      const show = (ctx) => {
        bd.dataset.locationId = ctx.locationId || "";
        bd.dataset.contactId  = ctx.contactId || "";
        document.getElementById("ghl-i1").value = "";
        document.getElementById("ghl-i2").value = "";
        document.getElementById("ghl-h2").textContent =
          `locationId: ${bd.dataset.locationId || "-"} · contactId: ${bd.dataset.contactId || "-"}`;
        bd.style.display = "flex";
      };
      bd.addEventListener("click", (e) => e.target === bd && hide());
      document.getElementById("ghl-cancel").addEventListener("click", hide);
      document.getElementById("ghl-send").addEventListener("click", async () => {
        const btn = document.getElementById("ghl-send");
        btn.disabled = true;
        try {
          const payload = {
            locationId: bd.dataset.locationId || null,
            contactId : bd.dataset.contactId || null,
            input1: document.getElementById("ghl-i1").value || "",
            input2: document.getElementById("ghl-i2").value || "",
            source: "ghl-header-btn"
          };
          if (ENDPOINT) {
            const r = await fetch(ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (!r.ok) throw new Error("HTTP " + r.status);
          } else {
            alert("Payload:\n" + JSON.stringify(payload, null, 2));
          }
          hide();
        } catch (e) {
          alert("No se pudo enviar. " + (e?.message || ""));
        } finally {
          btn.disabled = false;
        }
      });

      ensureModal.show = show;
      ensureModal.hide = hide;
    };
  })();

  // Dónde inyectar
  const findHeaderContainer = () =>
    document.querySelector(".flex.items-center .message-header-actions.contact-detail-actions")
    || document.querySelector(".flex.items-center .message-header-actions")
    || null;

  // Lógica de inyección (idempotente)
  const injectButton = () => {
    if (!urlMatches()) return; // fuera de la location o vista objetivo
    const container = findHeaderContainer();
    if (!container) return;
    if (container.querySelector(`button[${BTN_ATTR}]`)) return;

    ensureStyle();

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghl-headerbtn";
    btn.setAttribute(BTN_ATTR, "1");
    btn.textContent = "Form";

    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      ensureModal();
      const ctx = { locationId: getLocationId(), contactId: getContactId() };
      if (typeof ensureModal.show === "function") ensureModal.show(ctx);
    });

    container.appendChild(btn);
  };

  // ============= Robustez ante SPA y repintados =============
  // 1) Debounced scheduler para observer
  let scheduled = false;
  const schedule = (delay = 60) => {
    if (scheduled) return;
    scheduled = true;
    const run = () => { scheduled = false; try { injectButton(); } catch {} };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: delay + 140 });
    } else {
      setTimeout(run, delay);
    }
  };

  // 2) Observer global: detecta nuevos nodos del header
  const mo = new MutationObserver((mut) => {
    // Si se agregan nodos, intentamos; si eliminan el botón, también reintentará el watchdog
    for (const m of mut) {
      if (m.addedNodes && m.addedNodes.length) { schedule(80); break; }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // 3) Hook de navegación SPA: pushState/replaceState/popstate
  const hookHistory = () => {
    const wrap = (fnName) => {
      const orig = history[fnName];
      history[fnName] = function () {
        const ret = orig.apply(this, arguments);
        window.dispatchEvent(new Event("ghl:navigation"));
        return ret;
      };
    };
    try {
      wrap("pushState"); wrap("replaceState");
    } catch {}
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("ghl:navigation")));
    window.addEventListener("ghl:navigation", () => {
      // Pequeño retraso para que el nuevo DOM aparezca
      setTimeout(() => { schedule(120); }, 60);
    });
  };
  hookHistory();

  // 4) Watchdog: cada 2s verifica si hace falta reinyectar (por si el framework lo “barre”)
  setInterval(() => {
    if (!urlMatches()) return;
    const container = findHeaderContainer();
    if (!container) return;
    if (!container.querySelector(`button[${BTN_ATTR}]`)) injectButton();
  }, 2000);

  // 5) Primer intento (por si todo ya está montado)
  schedule(0);

})();
</script>
