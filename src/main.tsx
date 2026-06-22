import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Wird zur Build-Zeit gesetzt (vite.config define). In der Desktop-App (file://)
// nutzen wir HashRouter, im Web BrowserRouter mit optionalem Basis-Pfad.
declare const __IS_ELECTRON__: boolean

const root = ReactDOM.createRoot(document.getElementById('root')!)

const tree = (
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)

if (__IS_ELECTRON__) {
  root.render(<HashRouter>{tree}</HashRouter>)
} else {
  const basename = import.meta.env.VITE_BASE || '/'
  root.render(<BrowserRouter basename={basename}>{tree}</BrowserRouter>)
}
