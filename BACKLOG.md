# 🧠 Window Manager Core — Task Inbox

## 1. Contexto

`window-manager-core` es una librería headless para gestionar sistemas de ventanas tipo escritorio en aplicaciones web.

El objetivo es ofrecer una base sólida, extensible y agnóstica de UI para:

* gestión de ventanas
* desktop
* taskbar
* interacción (drag, resize)
* persistencia de estado

---

## 2. Estado actual (esperado tras bootstrap)

* Monorepo inicializado
* Core con modelo de estado básico
* Reducer + commands
* Selectors básicos
* Integración React inicial
* Playground funcional
* Tests básicos

---

## 3. Principios de arquitectura

* Headless (sin dependencia de UI)
* Estado serializable y versionado
* Reducer puro + commands tipados
* Selectors como API derivada
* Separación estricta core / react
* Sin overengineering innecesario
* API pública clara y estable

---

## 4. Convenciones para futuras tareas

* No usar `any`
* No introducir lógica en React que pertenezca al core
* Toda regla de negocio debe vivir en el core
* Toda nueva feature debe incluir:

  * tests
  * actualización de tipos
  * actualización de docs si aplica
* Evitar breaking changes sin documentar

---

# 🚀 BACKLOG

---

# 🔴 P0 — IMPRESCINDIBLE (base funcional sólida)

---

## P0.1 — Window lifecycle completo

**Objetivo**
Implementar ciclo completo de vida de ventanas.

**Incluye**

* create
* close
* focus
* minimize
* maximize
* restore

**Archivos**

* core/state
* core/reducer
* core/commands

**Criterios de aceptación**

* no hay estados inconsistentes
* solo una ventana activa
* cerrar ventana activa selecciona nueva activa correctamente

---

## P0.2 — Z-order robusto

**Objetivo**
Sistema consistente de apilado de ventanas.

**Incluye**

* orderedWindowIds o equivalente
* bring-to-front en focus
* consistencia tras close/minimize

**Criterios**

* nunca hay duplicados
* orden siempre válido
* ventana activa siempre en top

---

## P0.3 — Desktop model

**Objetivo**
Modelar el escritorio como entidad real.

**Incluye**

* width / height
* bounds
* área usable

**Criterios**

* desktop es fuente de verdad para constraints
* actualizable dinámicamente

---

## P0.4 — Window movement (drag)

**Objetivo**
Permitir mover ventanas correctamente.

**Incluye**

* moveRect utils
* integración con commands

**Criterios**

* no mueve si maximizada
* respeta flags movable
* actualiza posición correctamente

---

## P0.5 — Window resize

**Objetivo**
Resize funcional por bordes/esquinas.

**Incluye**

* resizeRect utils
* minWidth / minHeight

**Criterios**

* no resize si no permitido
* no rompe constraints
* comportamiento estable

---

## P0.6 — Desktop bounds enforcement (CRÍTICO)

**Objetivo**
Evitar que ventanas se pierdan fuera del escritorio.

**Incluye**

* clamp al mover
* clamp al resize
* clamp tras hydrate
* clamp tras desktop resize

**Reglas**

* ventana debe permanecer completamente visible si es posible
* si es mayor que el desktop:

  * reducir tamaño si permitido
  * si no, anclar a zona visible

**Criterios**

* ninguna ventana queda inaccesible
* comportamiento consistente

---

## P0.7 — Desktop resize reflow

**Objetivo**
Reajustar ventanas cuando cambia tamaño del escritorio.

**Incluye**

* recalcular posiciones
* recalcular tamaños si necesario

**Criterios**

* ventanas siguen visibles
* no se rompen constraints

---

## P0.8 — Minimize / Taskbar logic

**Objetivo**
Sistema funcional de minimización.

**Incluye**

* ventanas minimizadas fuera del desktop
* representación en taskbar

**Criterios**

* restaurar devuelve a estado anterior
* taskbar refleja estado correctamente

---

## P0.9 — Maximize / Restore

**Objetivo**
Maximización completa del desktop.

**Incluye**

* uso de restoreRect
* bloqueo de drag/resize

**Criterios**

* ocupa todo el desktop
* restore devuelve al estado previo exacto

---

## P0.10 — Persistencia

**Objetivo**
Guardar y restaurar estado.

**Incluye**

* serialize
* hydrate
* versionado

**Criterios**

* estado restaurado consistente
* compatibilidad básica con cambios

---

## P0.11 — State sanitization

**Objetivo**
Evitar corrupción de estado.

**Incluye**

* validar rects
* validar z-order
* corregir inconsistencias

**Criterios**

* estado inválido nunca rompe sistema

---

## P0.12 — API pública estable

**Objetivo**
Definir API usable.

**Incluye**

* createWindowManager
* reducer
* commands
* selectors
* types

**Criterios**

* API clara
* sin leaks internos

---

## P0.13 — React integration base

**Objetivo**
Integración usable con React.

**Incluye**

* Provider
* hooks principales

**Criterios**

* sin lógica duplicada
* rendimiento razonable

---

## P0.14 — Playground funcional

**Objetivo**
Validar el sistema visualmente.

**Incluye**

* crear/mover/resize
* minimizar/maximizar
* taskbar
* persistencia

**Criterios**

* todo el flujo usable

---

## P0.15 — Testing core

**Objetivo**
Cubrir lógica crítica.

**Incluye tests**

* lifecycle
* z-order
* resize math
* persistence

---

# 🟠 P1 — IMPORTANTE

---

## P1.1 — Window constraints avanzados

* maxWidth / maxHeight
* movable / resizable / closable / minimizable / maximizable

---

## P1.2 — Focus policy formalizada

* reglas documentadas
* comportamiento consistente

---

## P1.3 — Selectors avanzados

* visible windows
* minimized
* taskbar items
* interactability

---

## P1.4 — Metadata de ventana

* icon
* payload custom

---

## P1.5 — Doble click para maximizar

---

## P1.6 — Keyboard navigation

---

## P1.7 — Accesibilidad base

---

## P1.8 — API documentation

---

## P1.9 — Ejemplos de uso

---

# 🟡 P2 — DESEABLE

---

## P2.1 — Snapping básico

---

## P2.2 — Animaciones

---

## P2.3 — Undo / redo

---

## P2.4 — Ventanas modales

---

## P2.5 — Políticas avanzadas de foco

---

## P2.6 — Portales / contenido desacoplado

---

# 🔵 P3 — FUTURO

---

## P3.1 — Multi-desktop

---

## P3.2 — Multi-monitor

---

## P3.3 — Tiling windows

---

## P3.4 — Docking system

---

## P3.5 — Plugin system

---

## P3.6 — Virtualización

---

# ⚠️ Riesgos y decisiones abiertas

---

## 1. Política de containment

Decidir si:

* siempre forzar full containment
* permitir overflow parcial

👉 Recomendación actual: full containment por defecto

---

## 2. Modelo de z-order

* array ordenado vs contador incremental

---

## 3. Persistencia versionada

* estrategia de migración futura

---

## 4. Performance

* necesidad futura de store optimizado (tipo zustand o similar)

---

## 5. UX vs lógica pura

* qué reglas viven en core vs adaptadores UI

---

# ✅ Definición de éxito de v1

* sistema completo funcional
* ventanas nunca se pierden fuera del desktop
* interacción fluida
* estado persistente
* API clara y usable
* playground demostrativo
* tests estables

---

Fin del documento.
