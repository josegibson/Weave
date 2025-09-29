import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

console.log('--- Preload script loaded ---');

const validChannels = [
  'main-process-message',
  'server-status'
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        const subscription = (event: IpcRendererEvent, ...args: any[]) => listener(event, ...args);
        ipcRenderer.on(channel, subscription);

        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
    },
    off: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
});