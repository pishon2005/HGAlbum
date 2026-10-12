import { useState, type FC, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/app/providers'
import { joinSchema, joinAndRegisterSchema } from '@/features/auth/model/schemas'
import { PasswordInput } from '@/shared/ui'

export const JoinPage: FC = () => {
  const { session, profile, couple, joinCouple, createCouple, signUp } = useAuth()
  const navigate = useNavigate()

  const [inviteCode, setInviteCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<{
    inviteCode?: string
    fullName?: string
    email?: string
    password?: string
  }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSwitchForm, setShowSwitchForm] = useState(false)

  // Si ya tiene una pareja vinculada
  const isAlreadyLinked = Boolean(session && profile?.couple_id && couple)

  const handleJoinExistingUser = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setFieldErrors({})

    const validation = joinSchema.safeParse({ inviteCode })
    if (!validation.success) {
      const errors: { inviteCode?: string } = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'inviteCode') errors.inviteCode = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await joinCouple(inviteCode)
      if (!result.success) {
        setServerError(result.error ?? 'Código de invitación no válido o inexistente')
      } else {
        setSuccessMessage('¡Te has vinculado con éxito al álbum de tu pareja!')
        setTimeout(() => {
          navigate({ to: '/' })
        }, 1200)
      }
    } catch (err) {
      setServerError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCouple = async () => {
    setServerError(null)
    setIsSubmitting(true)
    try {
      const result = await createCouple()
      if (!result.success) {
        setServerError(result.error ?? 'No se pudo crear tu álbum')
      } else {
        setSuccessMessage('¡Tu álbum está listo! Comparte el código con tu pareja.')
      }
    } catch (err) {
      setServerError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterAndJoin = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setFieldErrors({})

    const validation = joinAndRegisterSchema.safeParse({
      fullName,
      email,
      password,
      inviteCode,
    })

    if (!validation.success) {
      const errors: {
        fullName?: string
        email?: string
        password?: string
        inviteCode?: string
      } = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'fullName') errors.fullName = issue.message
        if (issue.path[0] === 'email') errors.email = issue.message
        if (issue.path[0] === 'password') errors.password = issue.message
        if (issue.path[0] === 'inviteCode') errors.inviteCode = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const { error, user } = await signUp({
        fullName,
        email,
        password,
        inviteCode,
      })

      if (error) {
        setServerError(error.message)
      } else if (user) {
        if (!user.confirmed_at && !session) {
          setSuccessMessage(
            '¡Cuenta creada y vinculada! Revisa tu correo electrónico para confirmar tu cuenta.',
          )
        } else {
          setSuccessMessage('¡Cuenta creada y vinculada con éxito!')
          setTimeout(() => {
            navigate({ to: '/' })
          }, 1000)
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
      <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-romantic/10 text-accent-romantic mb-3 text-2xl">
            💌
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Unirse a un Álbum</h1>
          <p className="text-sm text-text-secondary mt-1">
            Introduce el código compartido por tu pareja para conectar vuestro álbum
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl flex items-start gap-2">
            <span>🎉</span>
            <span>{successMessage}</span>
          </div>
        )}

        {isAlreadyLinked && !showSwitchForm ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-accent-romantic/10 rounded-xl text-text-primary">
              <p className="font-semibold text-accent-romantic">¡Ya estás en una pareja!</p>
              <p className="text-xs text-text-secondary mt-1">
                Código de tu álbum actual: <span className="font-mono font-bold">{couple?.invite_code}</span>
              </p>
            </div>
            <Link
              to="/"
              className="inline-block py-2.5 px-6 bg-accent-romantic text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Ir a Mi Álbum
            </Link>
            <div>
              <button
                type="button"
                onClick={() => setShowSwitchForm(true)}
                className="text-xs text-text-secondary hover:text-accent-romantic underline transition-colors cursor-pointer"
              >
                ¿Te dieron otro código? Cámbiate al álbum de tu pareja
              </button>
            </div>
          </div>
        ) : session ? (
          /* Usuario ya autenticado pero sin pareja vinculada */
          <form className="space-y-4" onSubmit={handleJoinExistingUser} noValidate>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Código de Invitación
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ej. a8f9b2c3d4e5"
                className={`w-full px-4 py-2.5 font-mono text-center tracking-widest text-lg rounded-lg border transition-all text-text-primary uppercase focus:outline-hidden focus:ring-2 ${
                  fieldErrors.inviteCode
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-accent-romantic/50 focus:border-accent-romantic'
                }`}
              />
              {fieldErrors.inviteCode && (
                <p className="text-red-500 text-xs mt-1 text-center">{fieldErrors.inviteCode}</p>
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
                  <span>Vinculando...</span>
                </>
              ) : (
                <span>Vincularme al Álbum</span>
              )}
            </button>

            {/* Alternativa: crear una pareja nueva y obtener código propio
                (solo si aún no tiene pareja; si ya tiene, este formulario es para cambiarse) */}
            {!isAlreadyLinked && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-text-secondary">o</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <button
                  type="button"
                  onClick={handleCreateCouple}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-white border border-accent-romantic/50 text-accent-romantic rounded-lg font-medium hover:bg-accent-romantic/5 disabled:opacity-60 transition-all cursor-pointer"
                >
                  ✨ Crear mi propio álbum y obtener un código
                </button>
                <p className="text-xs text-text-secondary text-center">
                  Si aún no tienes pareja vinculada, crea tu álbum y comparte el código que se generará.
                </p>
              </>
            )}
          </form>
        ) : (
          /* Usuario nuevo: crear cuenta e ingresar con el código */
          <form className="space-y-4" onSubmit={handleRegisterAndJoin} noValidate>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Código de Invitación de tu Pareja
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Código recibido"
                className={`w-full px-4 py-2.5 font-mono text-center tracking-widest uppercase rounded-lg border transition-all text-text-primary focus:outline-hidden focus:ring-2 ${
                  fieldErrors.inviteCode
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-accent-romantic/50 focus:border-accent-romantic'
                }`}
              />
              {fieldErrors.inviteCode && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.inviteCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Tu Nombre
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
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
                  <span>Creando y vinculando cuenta...</span>
                </>
              ) : (
                <span>Unirme al Álbum</span>
              )}
            </button>
          </form>
        )}

        {!session && (
          <div className="mt-6 text-center text-sm text-text-secondary space-y-1">
            <div>
              ¿Prefieres crear un álbum nuevo?{' '}
              <Link to="/register" className="text-accent-romantic font-semibold hover:underline">
                Crear álbum
              </Link>
            </div>
            <div>
              ¿Ya tienes cuenta y quieres iniciar sesión?{' '}
              <Link to="/login" className="text-interactive font-medium hover:underline">
                Inicia sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
