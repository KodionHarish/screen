// trayMenu.js
import path from "path";
import { Tray, Menu } from "electron";
import { fileURLToPath } from 'url';
let tray = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createTray(mainWindow, onQuit) {
  tray = new Tray(path.join(__dirname, "image.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow.show();
        mainWindow.focus(); 
      },
    },
    {
      label: "Hide App",
      click: () => {
        mainWindow.hide();
      },
    },
    {
      type: "separator"
    },
    {
      label: "Quit",
      click: () => {
        if (onQuit) onQuit();
      },
    },
  ]);

  tray.setToolTip("Screen Tracker App");
  tray.setContextMenu(contextMenu);

  // Double-click to show/hide the window
  tray.on("double-click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Single click to show context menu (Windows behavior)
  tray.on("click", () => {
    tray.popUpContextMenu();
  });
}