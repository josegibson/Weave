"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    on(channel, callback) {
      return electron.ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    off(channel, callback) {
      return electron.ipcRenderer.off(channel, callback);
    },
    send(channel, ...args) {
      return electron.ipcRenderer.send(channel, ...args);
    },
    invoke(channel, ...args) {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
  }
});
