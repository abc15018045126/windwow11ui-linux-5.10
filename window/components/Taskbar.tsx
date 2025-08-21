import React, {useState, useEffect, useContext, useMemo} from 'react';
import {OpenApp} from '../types';
import {DiscoveredAppDefinition, AppContext} from '../contexts/AppContext';
import {TASKBAR_HEIGHT} from '../constants';
import {useTheme} from '../theme';
import Icon from './icon';
import ContextMenu, {ContextMenuItem} from './ContextMenu';

interface TaskbarProps {
  openApps: OpenApp[];
  activeAppInstanceId: string | null;
  onToggleStartMenu: () => void;
  onAppIconClick: (app: DiscoveredAppDefinition, instanceId?: string) => void;
  // Functions to interact with window state
  onCloseApp: (instanceId: string) => void;
  onToggleMinimizeApp: (instanceId: string) => void;
  onToggleMaximizeApp: (instanceId: string) => void;
  onFocusApp: (instanceId: string) => void;
}

const Taskbar: React.FC<TaskbarProps> = ({
  openApps,
  activeAppInstanceId,
  onToggleStartMenu,
  onAppIconClick,
  onCloseApp,
  onToggleMinimizeApp,
  onToggleMaximizeApp,
  onFocusApp,
}) => {
  const {apps: discoveredApps, toggleAppPin} = useContext(AppContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const {theme} = useTheme();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const taskbarItems = useMemo(() => {
    const items = new Map<
      string,
      {appDef: DiscoveredAppDefinition; instance?: OpenApp}
    >();
    const openAppMap = new Map(openApps.map(app => [app.id, app]));

    const pinnedApps = discoveredApps.filter(app => app.isPinned);
    pinnedApps.forEach(appDef => {
      const key = appDef.appId || appDef.path!;
      items.set(key, {appDef, instance: openAppMap.get(key)});
    });

    openApps.forEach(openApp => {
      const key = openApp.id;
      if (!items.has(key)) {
        const appDef = discoveredApps.find(
          d => d.appId === key || d.id === key,
        );
        if (appDef) {
          items.set(key, {appDef, instance: openApp});
        }
      }
    });

    return Array.from(items.values());
  }, [discoveredApps, openApps]);

  const handleContextMenu = (
    e: React.MouseEvent,
    appDef: DiscoveredAppDefinition,
    instance?: OpenApp,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const menuItems: ContextMenuItem[] = [];

    if (instance) {
      menuItems.push({
        type: 'item',
        label: instance.isMinimized ? 'Restore' : 'Minimize',
        onClick: () => onToggleMinimizeApp(instance.instanceId),
      });
      if (!instance.isMinimized) {
        menuItems.push({
          type: 'item',
          label: instance.isMaximized ? 'Restore Down' : 'Maximize',
          onClick: () => onToggleMaximizeApp(instance.instanceId),
        });
      }
      menuItems.push({
        type: 'item',
        label: 'Close',
        onClick: () => onCloseApp(instance.instanceId),
      });
      menuItems.push({type: 'separator'});
    }

    menuItems.push({
      type: 'item',
      label: appDef.isPinned ? 'Unpin from taskbar' : 'Pin to taskbar',
      onClick: () => toggleAppPin && toggleAppPin(appDef.id),
    });

    if (!instance) {
      menuItems.push({
        type: 'item',
        label: 'Open',
        onClick: () => onAppIconClick(appDef),
      });
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY - (menuItems.length * 30), // Adjust to open above cursor
      items: menuItems
    });
  };

  return (
    <div
      className={`flex items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-50 ${theme.taskbar.background} ${theme.taskbar.textColor}`}
      style={{height: `${TASKBAR_HEIGHT}px`}}
      onContextMenu={e => e.preventDefault()} // Prevent native menu on empty taskbar space
      onClick={() => setContextMenu(null)} // Close menu on click away
    >
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="flex items-center space-x-2 h-full">
          <button
            onClick={onToggleStartMenu}
            className={`taskbar-start-button p-2 rounded h-full flex items-center ${theme.taskbar.buttonHover}`}
            aria-label="Start Menu"
          >
            <Icon iconName="start" className="w-5 h-5 text-blue-400" />
          </button>

          {taskbarItems.map(({appDef, instance}) => {
            const isActive =
              instance?.instanceId === activeAppInstanceId &&
              !instance?.isMinimized;
            const isMinimized = instance?.isMinimized;
            const isOpen = !!instance;

            return (
              <button
                key={appDef.id}
                onClick={e => {
                  e.stopPropagation();
                  onAppIconClick(appDef, instance?.instanceId);
                }}
                onContextMenu={e => handleContextMenu(e, appDef, instance)}
                className={`p-2 rounded h-[calc(100%-8px)] flex items-center relative transition-colors duration-150 ease-in-out
                            ${isActive ? theme.taskbar.activeButton : theme.taskbar.buttonHover}
                            ${isMinimized ? 'opacity-70' : ''}`}
                title={appDef.name}
              >
                <Icon iconName={appDef.icon} className="w-5 h-5" isSmall />
                {isOpen && (
                  <span
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded-t-sm
                                  ${isActive ? theme.taskbar.activeIndicator : isMinimized ? 'bg-gray-400' : 'bg-gray-500'}`}
                  ></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-3 text-xs">
        <div>
          {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div>
          {currentTime.toLocaleDateString([], {month: 'short', day: 'numeric'})}
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
