const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Most APIs have been moved to the Express server running in the main process.
  // We only expose functions here that are unique to the Electron renderer environment
  // and cannot be handled over a standard web API, like launching another Electron process.
  launchExternalApp: (appDef, args) =>
    ipcRenderer.send('app:launchExternal', appDef, args), // Use send for one-way

  onAppLaunched: callback => {
    const handler = (event, appDef) => callback(appDef);
    ipcRenderer.on('app-launched', handler);
    return () => ipcRenderer.removeListener('app-launched', handler);
  },

  onAppClosed: callback => {
    const handler = (event, pid) => callback(pid);
    ipcRenderer.on('app-closed', handler);
    return () => ipcRenderer.removeListener('app-closed', handler);
  },

  // Expose methods to manage proxy settings for a specific session partition.
  // This is essential for the in-app browser to route its traffic through a proxy.
  setProxyForSession: (partition, proxyConfig) =>
    ipcRenderer.invoke('session:set-proxy', partition, proxyConfig),
  clearProxyForSession: partition =>
    ipcRenderer.invoke('session:clear-proxy', partition),
});
