export const handleTogglePin = (
  appId: string,
  isPinned: boolean,
  pinApp: (appId: string) => void,
  unpinApp: (appId: string) => void,
) => {
  if (isPinned) {
    unpinApp(appId);
  } else {
    pinApp(appId);
  }
};
