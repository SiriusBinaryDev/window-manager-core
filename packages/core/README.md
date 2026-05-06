# @window-manager/core

Headless TypeScript state manager for desktop-style windows in web apps.

This package has no DOM or React dependency.

## Install

```bash
pnpm add @window-manager/core
```

## Basic Usage

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

## Features

- window lifecycle
- focus and z-order
- move and edge/corner resize
- desktops and monitors
- owner-scoped modals
- taskbar selectors
- monitor bounds enforcement
- optional snapping
- versioned serialization and hydration

## API

`createWindowManager()` exposes imperative methods such as `createWindow`,
`moveWindow`, `resizeWindow`, `focusWindow`, `maximizeWindow`, `minimizeWindow`,
`restoreWindow`, `closeWindow`, `serialize`, and `hydrate`.

The package also exports `commands`, `windowManagerReducer`,
`createInitialState`, `selectors`, and all public types.

See the repository README for complete examples.
