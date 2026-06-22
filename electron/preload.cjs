// Preload: stellt dem Renderer eine schmale, sichere Bruecke zur Verfuegung.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
  /** Schreibt eine .ics-Datei und oeffnet sie mit der Standard-App (Outlook). */
  openIcs: (filename, content) => ipcRenderer.invoke('open-ics', { filename, content }),
  getVersion: () => ipcRenderer.invoke('app-version'),
})
