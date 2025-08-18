// trayMenu.js
const path = require("path");
const { Tray, Menu } = require("electron");

let tray = null;

function createTray(mainWindow, onQuit) {
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
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        if (onQuit) onQuit();
      },
    },
  ]);

  tray.setToolTip("Screen Tracker App");
  tray.setContextMenu(contextMenu);

  // Double-click to toggle visibility
  tray.on("double-click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Single click (Windows behavior)
  tray.on("click", () => {
    tray.popUpContextMenu();
  });
}

module.exports = { createTray };