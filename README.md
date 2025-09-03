# GHL Custom Header Button

Este proyecto agrega un **botón personalizado** en el header de la vista de contactos dentro de **GoHighLevel (GHL)**.  
El botón abre un modal para enviar datos (ejemplo: `locationId`, `contactId` y campos adicionales) a un endpoint definido.

---

## 🚀 Características

- Inyecta automáticamente un botón en el header de **Contact Detail**.  
- Solo se activa para una `locationId` específica (configurable).  
- Resistente a la navegación tipo **SPA** de GHL:
  - Detecta cambios de ruta (`pushState`, `replaceState`, `popstate`).
  - Se reinserta si el framework vuelve a renderizar el header.
  - Watchdog que comprueba cada 2s que el botón siga presente.
- Modal ligero con inputs personalizables.
- Ejemplo de envío de datos vía `fetch` a tu backend.

---

 

