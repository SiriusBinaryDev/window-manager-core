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
- `flags`: `resizable`, `movable`, `closable`

## Reglas clave

- focus sube z-order.
- solo una ventana activa.
- maximize ocupa desktop completo.
- minimize oculta en desktop y queda en taskbar.
- restore recupera `restoreRect`.
- close activa la siguiente ventana visible.
