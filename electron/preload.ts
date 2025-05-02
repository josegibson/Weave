import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on(channel: string, callback: (...args: any[]) => void) {
      return ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    off(channel: string, callback: (...args: any[]) => void) {
      return ipcRenderer.off(channel, callback);
    },
    send(channel: string, ...args: any[]) {
      return ipcRenderer.send(channel, ...args);
    },
    invoke(channel: string, ...args: any[]) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
})
