import {AppDefinition, FilesystemItem} from '../../../types';
import {ContextMenuItem} from '../ContextMenu';
import {getAppsForExtension} from '../../../../services/fileAssociationService';

import {handleNewFolder, handleNewFile} from './create';
import {handleDeleteItem} from './delete';
import {handleShowProperties} from './properties';
import {handleCreateShortcut} from './shortcut';

type OpenAppFunction = (
  appIdentifier: string | AppDefinition,
  initialData?: any,
) => void;

export interface MenuBuilderContext {
  clickedItem?: FilesystemItem;
  currentPath: string;
  refresh: () => void;
  openApp: OpenAppFunction;
  onRename: (item: FilesystemItem) => void;
  onCopy: (item: FilesystemItem) => void;
  onCut: (item: FilesystemItem) => void;
  onPaste: (path: string) => void;
  onOpen: (item: FilesystemItem) => void;
  isPasteDisabled: boolean;
}

export const buildContextMenu = async (
  context: MenuBuilderContext,
): Promise<ContextMenuItem[]> => {
  const {
    clickedItem,
    currentPath,
    refresh,
    openApp,
    onRename,
    onCopy,
    onCut,
    onPaste,
    onOpen,
    isPasteDisabled,
  } = context;

  if (clickedItem) {
    // Clicked on a file or folder
    const menuItems: ContextMenuItem[] = [
      {type: 'item', label: 'Open', onClick: () => onOpen(clickedItem)},
    ];

    if (clickedItem.type === 'file') {
      const extension = `.${clickedItem.name.split('.').pop() || ''}`.toLowerCase();
      const apps = await getAppsForExtension(extension);

      if (apps.length > 0) {
        menuItems.push({
          type: 'submenu',
          label: 'Open with',
          submenu: apps.map(app => ({
            type: 'item',
            label: app.name,
            onClick: () => openApp(app.id, {filePath: clickedItem.path}),
          })),
        });
      }
    }

    menuItems.push(
      {type: 'separator'},
      {type: 'item', label: 'Cut', onClick: () => onCut(clickedItem)},
      {type: 'item', label: 'Copy', onClick: () => onCopy(clickedItem)},
      {type: 'separator'},
      {
        type: 'item',
        label: 'Create shortcut',
        onClick: () => handleCreateShortcut(clickedItem, refresh),
      },
      {
        type: 'item',
        label: 'Delete',
        onClick: () => handleDeleteItem(clickedItem, refresh),
      },
      {type: 'item', label: 'Rename', onClick: () => onRename(clickedItem)},
      {type: 'separator'},
      {
        type: 'item',
        label: 'Properties',
        onClick: () => handleShowProperties(clickedItem, openApp),
      },
    );
    return menuItems;
  } else {
    // Clicked on the background
    return [
      {
        type: 'item',
        label: 'New Folder',
        onClick: () => handleNewFolder(currentPath, refresh),
      },
      {
        type: 'item',
        label: 'New Text File',
        onClick: () => handleNewFile(currentPath, refresh),
      },
      {type: 'separator'},
      {
        type: 'item',
        label: 'Paste',
        onClick: () => onPaste(currentPath),
        disabled: isPasteDisabled,
      },
    ];
  }
};
