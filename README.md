# window-manager-core

`window-manager-core` es una librería frontend headless para modelar sistemas de ventanas estilo desktop en apps web modernas.

## ¿Para qué sirve?

Permite gestionar ventanas con identidad, foco, z-order, minimizar/maximizar/restaurar/cerrar, drag/resize, límites de escritorio, taskbar y persistencia de estado serializable, sin acoplar la lógica a un framework de UI.

## Ejemplo básico

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.createWindow({ id: '1', title: 'Explorer' });
wm.focusWindow('1');
```

## Arquitectura

- `packages/core`: lógica pura (comandos, reducer, selectors, matemáticas y serialización).
- `packages/react`: provider y hooks React que consumen el core sin duplicar reglas.
- `apps/playground`: demo real usando la librería publicada en el monorepo.
- `docs`: arquitectura, modelo de estado y roadmap.
- `ai`: inbox de tareas para agentes IA.

## Ejecutar playground

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm test
pnpm build
pnpm lint
pnpm typecheck
```
