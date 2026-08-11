import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppDataProvider } from './app/AppDataProvider'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) throw new Error('找不到 React root')

createRoot(root).render(
  <StrictMode>
    <AppDataProvider>
      <App />
    </AppDataProvider>
  </StrictMode>,
)
