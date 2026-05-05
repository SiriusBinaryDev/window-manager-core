# State model

```ts
interface WindowManagerState {
  version: number;
  windows: Record<WindowId, WindowEntity>;
  orderedWindowIds: WindowId[];
  activeWindowId: WindowId | null;
  desktop: DesktopState;
}
```

## WindowEntity

- `id`
- `title?`
- `state`: `minimized`, `maximized`, `closed`
- `rect`
- `restoreRect`
- `flags`: `resizable`, `movable`, `closable`, `minimizable`, `maximizable`

## Reglas clave

- focus sube z-order.
- solo una ventana activa.
- maximize ocupa desktop completo cuando `flags.maximizable` es `true`.
- minimize oculta en desktop y queda en taskbar cuando `flags.minimizable` es `true`.
- restore recupera `restoreRect`.
- close activa la siguiente ventana visible cuando `flags.closable` es `true`.
