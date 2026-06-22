// Electron-Hauptprozess. Laedt im Dev den Vite-Server, im gebauten Programm
// die statischen Dateien aus dist/. Bietet IPC zum Oeffnen von .ics-Dateien
// (Outlook/Kalender) und einen automatischen Updater (electron-updater).
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs')

const isDev = !app.isPackaged
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f7f8fb',
    autoHideMenuBar: true,
    title: 'ProjectGuide',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const startUrl = process.env.ELECTRON_START_URL
  if (startUrl) {
    mainWindow.loadURL(startUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Externe Links im Standardbrowser oeffnen, nicht im App-Fenster.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// --- IPC: .ics-Datei schreiben und mit der Standard-App (Outlook) oeffnen ---
ipcMain.handle('open-ics', async (_event, { filename, content }) => {
  try {
    const safe = String(filename || 'termine.ics').replace(/[^a-zA-Z0-9._-]+/g, '_')
    const filePath = path.join(os.tmpdir(), `projectguide-${Date.now()}-${safe}`)
    fs.writeFileSync(filePath, content, 'utf8')
    const result = await shell.openPath(filePath)
    // shell.openPath gibt bei Erfolg einen leeren String zurueck.
    if (result) return { ok: false, error: result }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('app-version', () => app.getVersion())

// --- Auto-Update (nur im gebauten Programm) ---------------------------------
function setupAutoUpdate() {
  if (isDev) return
  try {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.autoDownload = true
    autoUpdater.on('update-available', () => console.log('[update] verfuegbar – wird geladen'))
    autoUpdater.on('update-downloaded', () => console.log('[update] geladen – beim Neustart aktiv'))
    autoUpdater.on('error', (e) => console.warn('[update] Fehler:', e == null ? 'unbekannt' : e.message))
    autoUpdater.checkForUpdatesAndNotify()
  } catch (err) {
    console.warn('[update] Updater nicht verfuegbar:', String(err))
  }
}

app.whenReady().then(() => {
  createWindow()
  setupAutoUpdate()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
