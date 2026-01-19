import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
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
