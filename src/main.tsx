import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppDataProvider } from './app/AppDataProvider'
import { ThemeProvider } from './features/theme/ThemeProvider'
import { TourProvider } from './features/tour/TourProvider'
import '@fontsource/noto-serif-tc/700.css'
import '@fontsource/rajdhani/latin-400.css'
import '@fontsource/rajdhani/latin-500.css'
import '@fontsource/rajdhani/latin-600.css'
import '@fontsource/rajdhani/latin-700.css'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) throw new Error('找不到 React root')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <AppDataProvider>
        <TourProvider>
          <App />
        </TourProvider>
      </AppDataProvider>
    </ThemeProvider>
  </StrictMode>,
)
