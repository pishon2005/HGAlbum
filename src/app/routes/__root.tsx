import { useState } from 'react'
import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAuth } from '@/app/providers'
import { usePhotosRealtime } from '@/entities/photo'

export const Route = createRootRoute({
  component: RootComponent,
})

const navLinkClass =
  'text-text-secondary hover:text-text-primary transition-colors [&.active]:text-accent-romantic [&.active]:font-semibold'

function RootComponent() {
  const { session, user, profile, couple, signOut } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Actualización en tiempo real: si la pareja sube/edita/elimina fotos,
  // la UI se refresca sin recargar la página
  usePhotosRealtime()

  // Nombre visible: perfil → metadatos de auth → parte local del email
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    ''

  const handleCopyCode = () => {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-text-primary">
            <span className="text-accent-romantic text-2xl">❤️</span>
            <span className="tracking-tight">HGAlbum</span>
          </Link>

          {/* Navegación de escritorio */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link to="/" className={navLinkClass}>
              Inicio
            </Link>
            {session && (
              <>
                <Link to="/timeline" className={navLinkClass}>
                  Timeline
                </Link>
                <Link to="/albums" className={navLinkClass}>
                  Álbumes
                </Link>
                <Link to="/gallery" className={navLinkClass}>
                  Galería
                </Link>
              </>
            )}

            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/upload"
                  className="px-3 py-1.5 rounded-lg bg-accent-romantic text-white hover:opacity-90 transition-opacity font-medium text-sm flex items-center gap-1.5 shadow-xs"
                >
                  <span>📷</span>
                  <span>Subir Recuerdos</span>
                </Link>
                {couple?.invite_code && (
                  <button
                    onClick={handleCopyCode}
                    title="Haz clic para copiar el código de invitación"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-romantic/10 text-accent-romantic text-xs font-mono font-medium hover:bg-accent-romantic/20 transition-all cursor-pointer"
                  >
                    <span>Código: {couple.invite_code}</span>
                    <span>{copied ? '✓' : '📋'}</span>
                  </button>
                )}
                <span className="text-text-primary font-medium text-sm">{displayName}</span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-100 transition-colors text-xs cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className={navLinkClass}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" className={navLinkClass}>
                  Registrarse
                </Link>
                <Link
                  to="/join"
                  className="px-3 py-1.5 rounded-lg bg-accent-romantic text-white hover:opacity-90 transition-opacity font-medium text-sm"
                >
                  Unirse con Código
                </Link>
              </div>
            )}
          </nav>

          {/* Barra móvil: subir + menú hamburguesa */}
          <div className="flex md:hidden items-center gap-2">
            {session && (
              <Link
                to="/upload"
                className="px-3 py-1.5 rounded-lg bg-accent-romantic text-white hover:opacity-90 transition-opacity font-medium text-xs flex items-center gap-1 shadow-xs"
              >
                <span>📷</span>
                <span>Subir</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <nav
            className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            <Link to="/" className={`block rounded-lg px-3 py-2.5 ${navLinkClass}`}>
              🏠 Inicio
            </Link>
            {session ? (
              <>
                <Link to="/timeline" className={`block rounded-lg px-3 py-2.5 ${navLinkClass}`}>
                  📅 Timeline
                </Link>
                <Link to="/albums" className={`block rounded-lg px-3 py-2.5 ${navLinkClass}`}>
                  📚 Álbumes
                </Link>
                <Link to="/gallery" className={`block rounded-lg px-3 py-2.5 ${navLinkClass}`}>
                  🖼️ Galería
                </Link>

                {couple?.invite_code && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleCopyCode()
                    }}
                    className="w-full text-left rounded-lg px-3 py-2.5 text-accent-romantic hover:bg-accent-romantic/5 transition-colors cursor-pointer"
                  >
                    💌 Código de invitación:{' '}
                    <span className="font-mono font-bold">{couple.invite_code}</span>{' '}
                    <span>{copied ? '✓ Copiado' : '📋'}</span>
                  </button>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2 px-3">
                  <span className="text-text-primary font-semibold">{displayName}</span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-100 transition-colors text-xs cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`block rounded-lg px-3 py-2.5 ${navLinkClass}`}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" className={`block rounded-lg px-3 py-2.5 ${navLinkClass}`}>
                  Registrarse
                </Link>
                <Link
                  to="/join"
                  className="block rounded-lg px-3 py-2.5 bg-accent-romantic text-white text-center font-semibold"
                >
                  Unirse con Código
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-text-secondary bg-white/50">
        <p>HGAlbum &copy; {new Date().getFullYear()} — Nuestro espacio privado</p>
      </footer>

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}
