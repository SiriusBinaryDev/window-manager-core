# @window-manager/core

Core headless para gestionar ventanas tipo desktop en apps web.

No depende de React ni del DOM.

## Instalacion

```bash
pnpm add @window-manager/core
```

## Uso basico

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.createWindow({
  id: 'terminal',
  title: 'Terminal',
  rect: { x: 40, y: 40, width: 640, height: 360 },
});

wm.moveWindow('terminal', 20, 10);
wm.resizeWindow('terminal', 'bottom-right', 80, 40);

console.log(wm.getState());
```

## Incluye

- lifecycle de ventanas
- focus y z-order
- move y resize por bordes/esquinas
- desktops y monitores
- modales por owner
- taskbar por selector
- serializacion e hidratacion versionada

## API

`createWindowManager()` expone comandos imperativos como `createWindow`,
`moveWindow`, `resizeWindow`, `focusWindow`, `maximizeWindow`, `minimizeWindow`,
`restoreWindow`, `closeWindow`, `serialize` y `hydrate`.

Tambien se exportan `commands`, `windowManagerReducer`, `createInitialState`,
`selectors` y todos los tipos publicos.

Ver el README del repositorio para ejemplos completos.
