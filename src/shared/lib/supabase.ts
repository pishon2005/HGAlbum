import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Mostrar un error visible en lugar de una pantalla en blanco
  const message =
    'Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Configúralas en el panel de Vercel (Settings → Environment Variables) y vuelve a desplegar.'
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F9FAFB;font-family:system-ui,sans-serif;padding:1rem">
      <div style="max-width:28rem;background:#fff;border:1px solid #FECACA;border-radius:1rem;padding:2rem;text-align:center">
        <div style="font-size:2.5rem">⚠️</div>
        <h1 style="color:#1F2937;font-size:1.25rem;font-weight:700;margin:0.75rem 0 0.5rem">Error de configuración</h1>
        <p style="color:#6B7280;font-size:0.875rem;line-height:1.5">${message}</p>
      </div>
    </div>`
  throw new Error(message)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
