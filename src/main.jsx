import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker after app is loaded (only in production)
if (import.meta.env.PROD) {
  import('./utils/serviceWorkerRegistration').then(({ registerServiceWorker }) => {
    registerServiceWorker()
  }).catch(err => {
    console.log('Service worker registration skipped:', err)
  })
}
