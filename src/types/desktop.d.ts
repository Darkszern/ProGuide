// Vom Electron-Preload bereitgestellte Bruecke (nur in der Desktop-App vorhanden).
export {}

declare global {
  interface DesktopBridge {
    isDesktop: true
    platform: string
    openIcs: (filename: string, content: string) => Promise<{ ok: boolean; error?: string }>
    getVersion: () => Promise<string>
  }
  interface Window {
    desktop?: DesktopBridge
  }
}
