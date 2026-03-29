import { createRoot } from 'react-dom/client'
import App from './App'
import { checkApiSecurity } from '@/lib/api-guard'
import '@/styles/index.css'

checkApiSecurity();

createRoot(document.getElementById("root")!).render(<App />);
