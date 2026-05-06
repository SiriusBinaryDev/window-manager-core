# Architecture

## Principios

1. Core headless: sin DOM, sin React y sin estado global externo.
2. Estado serializable, versionado y facil de inspeccionar.
3. Reducer puro para las reglas de negocio.
4. API imperativa opcional con `createWindowManager()`.
5. Selectors para lecturas derivadas.

## Capas

### Core (`packages/core`)

- `types.ts`: tipos publicos del dominio.
- `commands.ts`: factories de comandos tipados.
- `reducer.ts`: reglas de negocio.
- `selectors.ts`: lecturas derivadas.
- `math.ts`: movimiento, resize, snapping y bounds.
- `serialization.ts`: serializacion, hidratacion, migraciones y sanitizacion.
- `createWindowManager.ts`: facade imperativa con subscribe/persistencia.

### React (`packages/react`)

- `WindowManagerProvider` recibe o crea una instancia del manager.
- Hooks sobre `useSyncExternalStore` para leer estado vivo.
- No reimplementa reglas del core.

### Playground (`apps/playground`)

- Demo Vite + React.
- Usa los paquetes workspace como integracion real.
- Muestra creacion, foco, drag, resize por bordes/esquinas, desktops,
  monitores, modales, taskbar y persistencia en `localStorage`.

## Modelo de propiedad

- El estado raiz contiene `windows`, `desktops` y `activeDesktopId`.
- Cada desktop contiene sus monitores, `activeMonitorId`, z-order y ventana activa.
- Cada ventana pertenece a un desktop y un monitor.
- Una ventana modal declara `ownerWindowId` y hereda desktop y monitor del owner.

## Reglas importantes

- `orderedWindowIds` define el z-order dentro de un desktop.
- Solo ventanas no cerradas y no minimizadas pueden recibir foco.
- Si hay un modal visible, solo el modal superior puede recibir foco en ese desktop.
- Movimiento y resize mantienen la ventana dentro del monitor asignado.
- `serialize()` y `hydrate()` son el camino recomendado para persistencia.
- El estado actual usa version `4`.
