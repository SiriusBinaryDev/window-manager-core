import { createWindowManager, type WindowManager } from '@window-manager/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  useActiveMonitorId,
  useActiveDesktopId,
  useActiveWorkspaceId,
  WindowManagerProvider,
  useDesktop,
  useDesktops,
  useWorkspace,
  useWorkspaces,
  useTaskbar,
  useVisibleWindows,
  useWindow,
  useWindowManager,
} from '../src';

function Snapshot({
  expectedManager,
}: {
  expectedManager: WindowManager;
}): React.JSX.Element {
  const manager = useWindowManager();
  const desktop = useDesktop();
  const desktops = useDesktops();
  const workspace = useWorkspace();
  const workspaces = useWorkspaces();
  const activeDesktopId = useActiveDesktopId();
  const activeWorkspaceId = useActiveWorkspaceId();
  const activeMonitorId = useActiveMonitorId();
  const taskbar = useTaskbar();
  const visibleWindows = useVisibleWindows();
  const windowEntity = useWindow('alpha');

  return (
    <div
      data-manager-match={manager === expectedManager ? 'true' : 'false'}
      data-active-desktop-id={activeDesktopId}
      data-active-workspace-id={activeWorkspaceId}
      data-active-monitor-id={activeMonitorId}
      data-desktop-width={String(desktop.size.width)}
      data-desktop-count={String(desktops.length)}
      data-workspace-id={workspace.id}
      data-workspace-count={String(workspaces.length)}
      data-taskbar-count={String(taskbar.length)}
      data-visible-count={String(visibleWindows.length)}
      data-window-title={windowEntity?.title ?? ''}
    />
  );
}

function MissingProviderConsumer(): React.JSX.Element {
  useWindowManager();
  return <div />;
}

describe('@window-manager/react', () => {
  it('exposes manager-backed state through the provider hooks', () => {
    const manager = createWindowManager();
    manager.setDesktop({
      size: { width: 900, height: 600 },
      bounds: { minX: 0, minY: 0, maxX: 900, maxY: 600 },
    });
    manager.createWindow({ id: 'alpha', title: 'Alpha window' });
    manager.createWindow({ id: 'beta', title: 'Beta window' });
    manager.minimizeWindow('beta');

    const markup = renderToStaticMarkup(
      <WindowManagerProvider manager={manager}>
        <Snapshot expectedManager={manager} />
      </WindowManagerProvider>,
    );

    expect(markup).toContain('data-manager-match="true"');
    expect(markup).toContain('data-active-desktop-id="default"');
    expect(markup).toContain('data-active-workspace-id="default"');
    expect(markup).toContain('data-active-monitor-id="default"');
    expect(markup).toContain('data-desktop-width="900"');
    expect(markup).toContain('data-desktop-count="1"');
    expect(markup).toContain('data-workspace-id="default"');
    expect(markup).toContain('data-workspace-count="1"');
    expect(markup).toContain('data-taskbar-count="2"');
    expect(markup).toContain('data-visible-count="1"');
    expect(markup).toContain('data-window-title="Alpha window"');
  });

  it('throws when hooks are used outside the provider', () => {
    expect(() => renderToStaticMarkup(<MissingProviderConsumer />)).toThrow(
      'WindowManagerProvider is required',
    );
  });
});
