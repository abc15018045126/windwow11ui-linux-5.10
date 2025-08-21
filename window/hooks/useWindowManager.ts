import {useState, useCallback, useEffect} from 'react';
import {OpenApp, AppDefinition} from '../types';
import {
  TASKBAR_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
} from '../constants';
import {getAppDefinitions} from '../../components/apps';

export const useWindowManager = (
  desktopRef: React.RefObject<HTMLDivElement>,
) => {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeAppInstanceId, setActiveAppInstanceId] = useState<string | null>(
    null,
  );
  const [nextZIndex, setNextZIndex] = useState<number>(10);
  const [appDefinitions, setAppDefinitions] = useState<AppDefinition[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    const loadApps = async () => {
      setAppsLoading(true);
      const definitions = await getAppDefinitions();
      setAppDefinitions(definitions);
      setAppsLoading(false);
    };
    loadApps();
  }, []);

  const getNextPosition = (appWidth: number, appHeight: number) => {
    const desktopWidth = desktopRef.current?.clientWidth || window.innerWidth;
    const desktopHeight =
      (desktopRef.current?.clientHeight || window.innerHeight) - TASKBAR_HEIGHT;

    const baseOffset = 20;
    const openAppCount = openApps.filter(app => !app.isMinimized).length;
    const xOffset =
      (openAppCount * baseOffset) % (desktopWidth - appWidth - baseOffset * 2);
    const yOffset =
      (openAppCount * baseOffset) %
      (desktopHeight - appHeight - baseOffset * 2);

    return {
      x: Math.max(0, Math.min(xOffset + baseOffset, desktopWidth - appWidth)),
      y: Math.max(0, Math.min(yOffset + baseOffset, desktopHeight - appHeight)),
    };
  };

  const openApp = useCallback(
    async (appIdentifier: string | AppDefinition, initialData?: any) => {
      let appDef: AppDefinition | undefined;

      if (typeof appIdentifier === 'string') {
        appDef = appDefinitions.find(app => app.id === appIdentifier);
      } else {
        const potentialAppDef = appIdentifier as any;
        if (potentialAppDef.path && !potentialAppDef.externalPath) {
          potentialAppDef.externalPath = potentialAppDef.path;
        }
        appDef = potentialAppDef;
      }

      if (!appDef) {
        const id =
          typeof appIdentifier === 'string'
            ? appIdentifier
            : JSON.stringify(appIdentifier);
        console.error(`App with identifier "${id}" not found or invalid.`);
        return;
      }

      if (appDef.isExternal && appDef.externalPath) {
        if (window.electronAPI?.launchExternalApp) {
          window.electronAPI.launchExternalApp(appDef.externalPath);
        } else {
          fetch('http://localhost:3001/api/launch', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({path: appDef.externalPath}),
          }).catch(error => {
            console.error('Failed to launch external app via API:', error);
            alert(
              'Failed to launch application. Ensure the backend server is running.',
            );
          });
        }
        return;
      }

      if (!appDef.id) {
        console.error('Cannot open internal app without an ID.', appDef);
        return;
      }

      if (!initialData) {
        const existingAppInstance = openApps.find(
          app => app.id === appDef!.id && !app.isMinimized,
        );
        if (existingAppInstance) {
          focusApp(existingAppInstance.instanceId);
          return;
        }
        const minimizedInstance = openApps.find(
          app => app.id === appDef!.id && app.isMinimized,
        );
        if (minimizedInstance) {
          toggleMinimizeApp(minimizedInstance.instanceId);
          return;
        }
      }

      const instanceId = `${appDef.id}-${Date.now()}`;
      const newZIndex = nextZIndex + 1;
      setNextZIndex(newZIndex);

      const defaultWidth = appDef.defaultSize?.width || DEFAULT_WINDOW_WIDTH;
      const defaultHeight = appDef.defaultSize?.height || DEFAULT_WINDOW_HEIGHT;

      const newApp: OpenApp = {
        ...appDef,
        icon: appDef.icon,
        instanceId,
        zIndex: newZIndex,
        position: getNextPosition(defaultWidth, defaultHeight),
        size: {width: defaultWidth, height: defaultHeight},
        isMinimized: false,
        isMaximized: false,
        title: appDef.name,
        initialData: initialData,
      };

      setOpenApps(currentOpenApps => [...currentOpenApps, newApp]);
      setActiveAppInstanceId(instanceId);
    },
    [appDefinitions, nextZIndex],
  );

  const focusApp = useCallback(
    (instanceId: string) => {
      if (activeAppInstanceId === instanceId) return;

      const newZIndex = nextZIndex + 1;
      setNextZIndex(newZIndex);
      setOpenApps(prev =>
        prev.map(app =>
          app.instanceId === instanceId
            ? {...app, zIndex: newZIndex, isMinimized: false}
            : app,
        ),
      );
      setActiveAppInstanceId(instanceId);
    },
    [activeAppInstanceId, nextZIndex],
  );

  const closeApp = useCallback(
    (instanceId: string) => {
      setOpenApps(prev => prev.filter(app => app.instanceId !== instanceId));
      if (activeAppInstanceId === instanceId) {
        const remainingApps = openApps.filter(
          app => app.instanceId !== instanceId,
        );
        const nextActiveApp =
          remainingApps.length > 0
            ? remainingApps[remainingApps.length - 1].instanceId
            : null;
        setActiveAppInstanceId(nextActiveApp);
      }
    },
    [activeAppInstanceId, openApps],
  );

  const toggleMinimizeApp = useCallback(
    (instanceId: string) => {
      const app = openApps.find(a => a.instanceId === instanceId);
      if (!app) return;

      setOpenApps(prev =>
        prev.map(a => {
          if (a.instanceId === instanceId) {
            return {...a, isMinimized: !a.isMinimized};
          }
          return a;
        }),
      );

      if (app.isMinimized) {
        focusApp(instanceId);
      } else if (activeAppInstanceId === instanceId) {
        setActiveAppInstanceId(null);
      }
    },
    [openApps, activeAppInstanceId, focusApp],
  );

  const toggleMaximizeApp = useCallback(
    (instanceId: string) => {
      setOpenApps(prevOpenApps =>
        prevOpenApps.map(app => {
          if (app.instanceId === instanceId) {
            const desktopWidth =
              desktopRef.current?.clientWidth || window.innerWidth;
            const desktopHeight =
              (desktopRef.current?.clientHeight || window.innerHeight) -
              TASKBAR_HEIGHT;

            if (app.isMaximized) {
              return {
                ...app,
                isMaximized: false,
                position:
                  app.previousPosition ||
                  getNextPosition(
                    app.previousSize?.width || app.size.width,
                    app.previousSize?.height || app.size.height,
                  ),
                size: app.previousSize || app.size,
              };
            } else {
              const newZ = nextZIndex + 1;
              setNextZIndex(newZ);
              setActiveAppInstanceId(instanceId);
              return {
                ...app,
                isMaximized: true,
                previousPosition: app.position,
                previousSize: app.size,
                position: {x: 0, y: 0},
                size: {width: desktopWidth, height: desktopHeight},
                zIndex: newZ,
              };
            }
          }
          return app;
        }),
      );
    },
    [nextZIndex],
  );

  const updateAppPosition = useCallback(
    (instanceId: string, position: {x: number; y: number}) => {
      setOpenApps(prev =>
        prev.map(app =>
          app.instanceId === instanceId ? {...app, position} : app,
        ),
      );
    },
    [],
  );

  const updateAppSize = useCallback(
    (instanceId: string, size: {width: number; height: number}) => {
      setOpenApps(prev =>
        prev.map(app => (app.instanceId === instanceId ? {...app, size} : app)),
      );
    },
    [],
  );

  const updateAppTitle = useCallback((instanceId: string, title: string) => {
    setOpenApps(prev =>
      prev.map(app => (app.instanceId === instanceId ? {...app, title} : app)),
    );
  }, []);

  // The hook returns everything the App component needs
  return {
    openApps,
    activeAppInstanceId,
    appDefinitions,
    appsLoading,
    desktopRef, // We need to pass the real ref from the component
    openApp,
    focusApp,
    closeApp,
    toggleMinimizeApp,
    toggleMaximizeApp,
    updateAppPosition,
    updateAppSize,
    updateAppTitle,
  };
};
