import {FilesystemItem} from '../../../types';

export const handleCreateShortcut = (
  item: FilesystemItem,
  refresh: () => void,
) => {
  // This is a placeholder. A full implementation would require creating a new .app file
  // on the desktop that points to the original item's path.
  alert('Create Shortcut feature is not yet implemented.');
};
