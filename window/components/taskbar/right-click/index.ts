import {AppDefinition, OpenApp} from '../../../types';
import {ContextMenuItem} from '../../ContextMenu';
import {handleCloseApp} from './close';
import {handleTogglePin} from './pin';
import {handleMinimizeApp} from './minimize';
import {handleMaximizeApp} from './maximize';

export interface TaskbarMenuBuilderContext {
  app: AppDefinition | OpenApp;
  instanceId?: string;
  isPinned: boolean;
  isRunning: boolean;
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
  closeApp: (instanceId: string) => void;
  minimizeApp: (instanceId: string) => void;
  maximizeApp: (instanceId: string) => void;
  openApp: (appId: string) => void;
}

export const buildTaskbarContextMenu = (
  context: TaskbarMenuBuilderContext,
): ContextMenuItem[] => {
  const {
    app,
    instanceId,
    isPinned,
    isRunning,
    pinApp,
    unpinApp,
    closeApp,
    minimizeApp,
    maximizeApp,
    openApp,
  } = context;

  const menuItems: ContextMenuItem[] = [];

  // If the app is running, add window management options
  if (isRunning && instanceId) {
    // We can add more options like "Move", "Size" later if needed.
    menuItems.push({
      type: 'item',
      label: 'Maximize',
      onClick: () => handleMaximizeApp(maximizeApp, instanceId),
    });
    menuItems.push({
      type: 'item',
      label: 'Minimize',
      onClick: () => handleMinimizeApp(minimizeApp, instanceId),
    });
    menuItems.push({type: 'separator'});
  }

  // Add the option to open a new instance of the app
  // (This could be more complex, e.g., checking if the app supports multiple instances)
  menuItems.push({
    type: 'item',
    label: app.name,
    onClick: () => openApp(app.id),
    disabled: true, // Placeholder, as we don't have a good icon for this yet
  });

  menuItems.push({type: 'separator'});

  // Add Pin/Unpin option
  menuItems.push({
    type: 'item',
    label: isPinned ? 'Unpin from taskbar' : 'Pin to taskbar',
    onClick: () => handleTogglePin(app.id, isPinned, pinApp, unpinApp),
  });

  // If the app is running, add the close option
  if (isRunning && instanceId) {
    menuItems.push({
      type: 'item',
      label: 'Close window',
      onClick: () => handleCloseApp(closeApp, instanceId),
    });
  }

  return menuItems;
};
