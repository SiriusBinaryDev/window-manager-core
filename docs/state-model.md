# State model

```ts
interface DesktopWorkspace {
  id: DesktopId;
  monitors: Record<MonitorId, MonitorState>;
  activeMonitorId: MonitorId;
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
- `monitorId`
- `ownerWindowId?`
- `title?`
- `state`: `minimized`, `maximized`, `closed`
- `rect`
- `restoreRect`
- `flags`: `resizable`, `movable`, `closable`, `minimizable`, `maximizable`

## Reglas clave

- cada desktop mantiene su propio conjunto de monitores, `orderedWindowIds` y `activeWindowId`
- `activeMonitorId` vive dentro de cada desktop workspace
- cada ventana pertenece a exactamente un desktop y un monitor
- una ventana modal declara `ownerWindowId` y hereda desktop y monitor de su owner
- solo hay una ventana activa por desktop
- una ventana focusable es una ventana no cerrada y no minimizada
- `focusWindow(id)` ignora ventanas no focusable
- `focusWindow(id)` cambia al desktop de la ventana si vive en otro workspace
- `focusWindow(id)` tambien mueve `activeMonitorId` al monitor de la ventana
- si existe un modal visible en el desktop, solo el modal superior puede recibir foco o participar en focus traversal
- `focusNextWindow()` y `focusPreviousWindow()` ciclan entre ventanas focusable del desktop activo
- minimizar o cerrar la ventana activa promueve la ventana focusable mas alta en `orderedWindowIds`
- cuando cambia la ventana activa y esta en otro monitor, `activeMonitorId` la sigue
- maximize ocupa el monitor completo de la ventana cuando `flags.maximizable` es `true`
- minimize oculta la ventana y la deja en taskbar cuando `flags.minimizable` es `true`
- restore recupera `restoreRect` dentro de los bounds del monitor asignado
- close activa la siguiente ventana visible cuando `flags.closable` es `true`
- cerrar un owner tambien cierra sus descendientes modales
- `createWindow({ desktopId?, monitorId?, ownerWindowId? })` usa el desktop activo y el monitor activo por defecto, o el workspace del owner si es modal
- `setMonitor(payload, desktopId?, monitorId?)` actualiza un monitor especifico o el monitor activo
- `setDesktop(payload, desktopId?, monitorId?)` se mantiene como alias compatible de `setMonitor(...)`
- la hidratacion migra automaticamente:
  - version 1 de desktop unico al workspace `default` con monitor `default`
  - version 2 multi-desktop al modelo de monitores por desktop
  - version 3 multi-monitor al modelo actual con soporte modal
