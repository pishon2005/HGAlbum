import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@/app/providers'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { session, user, profile, couple, loading } = useAuth()
  const [copied, setCopied] = useState(false)

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-accent-romantic/30 border-t-accent-romantic rounded-full animate-spin mb-3" />
        <p className="text-text-secondary text-sm">Cargando...</p>
      </div>
    )
  }

  // Vista para usuarios autenticados
  if (session) {
    return (
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Bienvenida */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-accent-romantic uppercase tracking-wider">
                Bienvenido/a de nuevo
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-1">
                Hola, {displayName} 👋
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Este es vuestro álbum privado de recuerdos compartidos.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/timeline"
                  className="px-4 py-2 bg-accent-romantic text-white text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm shadow-pink-200"
                >
                  📅 Ver Línea del Tiempo
                </Link>
                <Link
                  to="/upload"
                  className="px-4 py-2 bg-bg-secondary text-text-primary text-xs sm:text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ➕ Subir Recuerdos
                </Link>
              </div>
            </div>

            {couple?.invite_code && (
              <div className="bg-bg-secondary p-4 rounded-xl border border-gray-200 w-full sm:w-auto">
                <p className="text-xs text-text-secondary font-medium mb-1">
                  Código de invitación para tu pareja:
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-text-primary bg-white px-2.5 py-1 rounded-md border border-gray-200 select-all">
                    {couple.invite_code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 bg-accent-romantic text-white text-xs rounded-md font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta de estado de pareja */}
          {!profile?.couple_id && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-amber-900">
                  Aún no estás vinculado/a a una pareja
                </h2>
                <p className="text-sm text-amber-700 mt-1">
                  Introduce el código de invitación que te compartió tu pareja para sincronizar vuestros recuerdos.
                </p>
              </div>
              <Link
                to="/join"
                className="px-4 py-2 bg-amber-600 text-white font-medium text-sm rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
              >
                Vincularme ahora
              </Link>
            </div>
          )}

          {/* Panel de Recuerdos y Álbumes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/upload"
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:border-accent-romantic/40 transition-all block group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-romantic/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📸
              </div>
              <h2 className="text-lg font-bold text-text-primary group-hover:text-accent-romantic transition-colors">
                Subir Recuerdos
              </h2>
              <p className="text-sm text-text-secondary">
                Sube fotos y videos organizados por fecha para revivir momentos juntos.
              </p>
            </Link>

            <Link
              to="/albums"
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:border-accent-interactive/40 transition-all block group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-interactive/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📚
              </div>
              <h2 className="text-lg font-bold text-text-primary group-hover:text-accent-interactive transition-colors">
                Álbumes Temáticos
              </h2>
              <p className="text-sm text-text-secondary">
                Crea álbumes para viajes especiales, aniversarios y citas inolvidables.
              </p>
            </Link>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-success/10 flex items-center justify-center text-xl">
                🔒
              </div>
              <h2 className="text-lg font-bold text-text-primary">Privacidad Total</h2>
              <p className="text-sm text-text-secondary">
                Tus archivos están protegidos con Row Level Security y almacenamiento privado.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista para usuarios invitados (Landing)
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-romantic/10 text-accent-romantic text-sm font-medium">
          <span>✨</span> Álbum privado para parejas
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary">
          Guarda y revive cada momento juntos
        </h1>
        <p className="text-lg text-text-secondary max-w-xl mx-auto">
          Un espacio íntimo y seguro para vuestras fotos, vídeos y recuerdos más especiales.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-accent-romantic text-white font-semibold shadow-sm hover:opacity-90 transition-all shadow-pink-200"
          >
            Crear nuestro álbum
          </Link>
          <Link
            to="/join"
            className="px-6 py-3 rounded-xl bg-bg-secondary text-text-primary font-semibold hover:bg-gray-200 transition-all"
          >
            Tengo un código de invitación
          </Link>
        </div>
      </div>
    </div>
  )
}
