import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppV2 from './AppV2.tsx'
import { Buffer } from "buffer";
(window as any).global = window;
(window as any).Buffer = Buffer;


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppV2 />
  </StrictMode>,
)
