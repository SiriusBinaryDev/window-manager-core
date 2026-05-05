# State model

```ts
interface DesktopWorkspace {
  id: DesktopId;
  desktop: DesktopState;
  orderedWindowIds: WindowId[];
  activeWindowId: WindowId | null;
}

interface WindowManagerState {
  version: number;
  windows: Record<WindowId, WindowEntity>;
  desktops: Record<DesktopId, DesktopWorkspace>;
  activeDesktopId: DesktopId;
}
```

## WindowEntity

- `id`
- `desktopId`
- `title?`
- `state`: `minimized`, `maximized`, `closed`
- `rect`
- `restoreRect`
- `flags`: `resizable`, `movable`, `closable`, `minimizable`, `maximizable`

## Reglas clave

- focus sube z-order.
- cada desktop mantiene su propio `orderedWindowIds` y `activeWindowId`.
- solo hay una ventana activa por desktop.
- una ventana focusable es una ventana no cerrada y no minimizada.
- `focusWindow(id)` ignora ventanas no focusable.
- `focusWindow(id)` cambia al desktop de la ventana si vive en otro workspace.
- `focusNextWindow()` y `focusPreviousWindow()` ciclan solo entre ventanas focusable.
- minimizar o cerrar la ventana activa promueve la ventana focusable mas alta en `orderedWindowIds`.
- `restoreWindow(id)` trae la ventana al frente, la convierte en activa y cambia al desktop objetivo si hace falta.
- maximize ocupa desktop completo cuando `flags.maximizable` es `true`.
- minimize oculta en desktop y queda en taskbar cuando `flags.minimizable` es `true`.
- restore recupera `restoreRect`.
- close activa la siguiente ventana visible cuando `flags.closable` es `true`.
- `createWindow({ desktopId? })` usa el desktop activo por defecto.
- `setDesktop(payload, desktopId?)` actualiza el desktop activo por defecto o uno explicito si se pasa id.
- la hidratacion migra automaticamente el estado legado de un solo desktop al workspace `default`.
