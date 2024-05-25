const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Example of a method to send a message to the main process
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    // Example of a method to receive messages from the main process
    receive: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
);
