import { useState, useEffect, type FC, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/app/providers'
import { registerSchema } from '@/features/auth/model/schemas'
import { PasswordInput } from '@/shared/ui'

export const RegisterPage: FC = () => {
  const { signUp, session } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
  }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      navigate({ to: '/' })
    }
  }, [session, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setFieldErrors({})

    const validation = registerSchema.safeParse({ fullName, email, password })
    if (!validation.success) {
      const errors: { fullName?: string; email?: string; password?: string } = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'fullName') errors.fullName = issue.message
        if (issue.path[0] === 'email') errors.email = issue.message
        if (issue.path[0] === 'password') errors.password = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const { error, user } = await signUp({ fullName, email, password })
      if (error) {
        setServerError(error.message)
      } else if (user) {
        // Si Supabase requiere confirmación de email por correo
        if (!user.confirmed_at && !session) {
          setSuccessNotice(
            '¡Cuenta creada con éxito! Por favor, revisa tu correo electrónico para confirmar tu cuenta y poder iniciar sesión.',
          )
        } else {
          navigate({ to: '/' })
        }
      }
    } catch (err) {
      setServerError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-romantic/10 text-accent-romantic mb-3 text-2xl">
            ✨
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Crear Cuenta</h1>
          <p className="text-sm text-text-secondary mt-1">
            Comienza vuestro álbum de recuerdos para parejas
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {successNotice ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl">
              <p className="font-semibold mb-1">¡Registro completado!</p>
              <p>{successNotice}</p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center py-2.5 px-4 bg-accent-romantic text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Tu Nombre
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Ana o Carlos"
                className={`w-full px-4 py-2.5 rounded-lg border transition-all text-text-primary focus:outline-hidden focus:ring-2 ${
                  fieldErrors.fullName
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-accent-romantic/50 focus:border-accent-romantic'
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={`w-full px-4 py-2.5 rounded-lg border transition-all text-text-primary focus:outline-hidden focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-accent-romantic/50 focus:border-accent-romantic'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Contraseña
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                hasError={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-accent-romantic text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Creando tu cuenta y álbum...</span>
                </>
              ) : (
                <span>Crear Cuenta y Álbum</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-text-secondary space-y-2">
          <div>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent-romantic font-semibold hover:underline">
              Inicia sesión
            </Link>
          </div>
          <div>
            ¿Tu pareja ya creó el álbum?{' '}
            <Link to="/join" className="text-interactive font-medium hover:underline">
              Únete con su código
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
