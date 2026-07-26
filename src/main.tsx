import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './core/container'
import { container } from './core/container'
import { ContainerProvider } from './core/containerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContainerProvider value={container}>
      <App />
    </ContainerProvider>
  </StrictMode>,
)
