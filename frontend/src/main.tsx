import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/Tooltip'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider delayDuration={150} skipDelayDuration={300}>
        <App />
        <Toaster theme="system" position="top-right" />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
)
