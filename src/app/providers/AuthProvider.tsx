import { useEffect, useState, useCallback, type FC, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import type { Profile } from '@/entities/user'
import type { Couple } from '@/entities/couple'
import { AuthContext, type SignInParams, type SignUpParams } from './AuthContext'

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfileAndCouple = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.warn('Error fetching profile:', profileError.message)
      }

      // Auto-reparación: si el usuario no tiene perfil (p. ej. porque el registro
      // requirió confirmación de email y no hubo sesión para crearlo), lo creamos.
      let finalProfile = profileData
      if (!finalProfile) {
        const { data: authData } = await supabase.auth.getUser()
        const fullName =
          (authData.user?.user_metadata?.full_name as string | undefined) ??
          authData.user?.email ??
          'Sin nombre'

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({ id: userId, full_name: fullName })
          .select()
          .maybeSingle()

        if (createError) {
          console.warn('Error creating missing profile:', createError.message)
        }
        finalProfile = createdProfile

        // Si el usuario se registró con un código de invitación pero no hubo
        // sesión para vincularlo (confirmación de email), lo aplicamos ahora.
        const pendingCode = authData.user?.user_metadata?.invite_code as string | undefined
        if (finalProfile && !finalProfile.couple_id && pendingCode) {
          const { data: rpcData, error: rpcError } = await supabase.rpc('join_couple_by_code', {
            code: pendingCode,
          })
          if (!rpcError && (rpcData as { success?: boolean } | null)?.success) {
            const { data: linkedProfile } = await supabase
              .from('profiles')
              .select()
              .eq('id', userId)
              .maybeSingle()
            if (linkedProfile) finalProfile = linkedProfile
          }
        }
      } else if (!finalProfile.full_name?.trim()) {
        // Auto-reparación: perfil sin nombre → recuperarlo de los metadatos de auth
        const { data: authData } = await supabase.auth.getUser()
        const metadataName = authData.user?.user_metadata?.full_name as string | undefined
        if (metadataName?.trim()) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({ full_name: metadataName.trim() })
            .eq('id', userId)
            .select()
            .maybeSingle()
          if (updatedProfile) finalProfile = updatedProfile
        }
      }

      if (finalProfile) {
        setProfile(finalProfile as Profile)

        if (finalProfile.couple_id) {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('*')
            .eq('id', finalProfile.couple_id)
            .maybeSingle()

          if (!coupleError && coupleData) {
            setCouple(coupleData as Couple)
          } else {
            setCouple(null)
          }
        } else {
          setCouple(null)
        }
      } else {
        setProfile(null)
        setCouple(null)
      }
    } catch (err) {
      console.error('Error in fetchUserProfileAndCouple:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfileAndCouple(user.id)
    }
  }, [user, fetchUserProfileAndCouple])

  useEffect(() => {
    // 1. Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchUserProfileAndCouple(initialSession.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await fetchUserProfileAndCouple(newSession.user.id)
      } else {
        setProfile(null)
        setCouple(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfileAndCouple])

  const signIn = async ({ email, password }: SignInParams) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        await fetchUserProfileAndCouple(data.user.id)
      }

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const joinCouple = async (inviteCode: string): Promise<{ success: boolean; error: string | null }> => {
    // El código se genera en hex minúsculas; normalizar para que la comparación no falle
    const cleanCode = inviteCode.trim().toLowerCase()
    if (!cleanCode) {
      return { success: false, error: 'Código de invitación requerido' }
    }

    try {
      // 1. Intentar mediante la función RPC si existe en la base de datos
      const { data: rpcData, error: rpcError } = await supabase.rpc('join_couple_by_code', {
        code: cleanCode,
      })

      if (!rpcError && rpcData) {
        const result = rpcData as { success: boolean; error?: string; couple_id?: string }
        if (result.success) {
          await refreshProfile()
          return { success: true, error: null }
        }
        return { success: false, error: result.error ?? 'Error al unirse a la pareja' }
      }

      // 2. Fallback a consulta directa
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', cleanCode)
        .maybeSingle()

      if (coupleError || !coupleData) {
        return { success: false, error: 'Código de invitación no encontrado o no válido' }
      }

      const activeUserId = user?.id || (await supabase.auth.getUser()).data.user?.id
      if (!activeUserId) {
        return { success: false, error: 'Debes estar autenticado para unirte' }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ couple_id: coupleData.id })
        .eq('id', activeUserId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      await refreshProfile()
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  const signUp = async ({ fullName, email, password, inviteCode }: SignUpParams) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            // Guardar el código para vincularlo tras la confirmación de email,
            // cuando ya exista sesión y las políticas RLS lo permitan
            ...(inviteCode?.trim() ? { invite_code: inviteCode.trim().toLowerCase() } : {}),
          },
        },
      })

      if (error) {
        return { error, user: null }
      }

      const createdUser = data.user

      // Correo duplicado: Supabase devuelve un usuario "falso" sin identidades
      // para no revelar si el correo existe. Lo detectamos y avisamos.
      if (
        createdUser &&
        Array.isArray(createdUser.identities) &&
        createdUser.identities.length === 0
      ) {
        return {
          error: new Error('Este correo ya está registrado. Inicia sesión o usa otro correo.'),
          user: null,
        }
      }

      if (createdUser) {
        setUser(createdUser)
        setSession(data.session)

        let targetCoupleId: string | null = null

        if (inviteCode && inviteCode.trim()) {
          // Si proporcionó código de invitación al registrarse, vincular a esa pareja
          const { data: existingCouple } = await supabase
            .from('couples')
            .select('*')
            .eq('invite_code', inviteCode.trim().toLowerCase())
            .maybeSingle()

          if (existingCouple) {
            targetCoupleId = existingCouple.id
          } else {
            // Código inválido: no crear la cuenta con un álbum distinto al esperado
            return {
              error: new Error('El código de invitación no es válido. Pídeselo de nuevo a tu pareja.'),
              user: null,
            }
          }
        }

        // Si no tenía código de invitación, crear una nueva pareja en la tabla couples
        if (!targetCoupleId) {
          const { data: newCouple, error: coupleErr } = await supabase
            .from('couples')
            .insert({})
            .select()
            .single()

          if (!coupleErr && newCouple) {
            targetCoupleId = newCouple.id
            setCouple(newCouple as Couple)
          }
        }

        // Crear el perfil del usuario en profiles
        const { data: profileCreated, error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: createdUser.id,
            full_name: fullName,
            couple_id: targetCoupleId,
          })
          .select()
          .single()

        if (!profileErr && profileCreated) {
          setProfile(profileCreated as Profile)
        }
      }

      return { error: null, user: createdUser }
    } catch (err) {
      return { error: err as Error, user: null }
    }
  }

  const createCouple = async (): Promise<{ success: boolean; error: string | null }> => {
    try {
      const activeUserId = user?.id || (await supabase.auth.getUser()).data.user?.id
      if (!activeUserId) {
        return { success: false, error: 'Debes estar autenticado para crear un álbum' }
      }

      // Si ya tiene pareja, no crear otra
      if (profile?.couple_id) {
        return { success: true, error: null }
      }

      // Crear la pareja (el invite_code se genera por defecto en la tabla)
      const { data: newCouple, error: coupleError } = await supabase
        .from('couples')
        .insert({})
        .select()
        .single()

      if (coupleError || !newCouple) {
        return { success: false, error: coupleError?.message ?? 'No se pudo crear el álbum' }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ couple_id: newCouple.id })
        .eq('id', activeUserId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      await refreshProfile()
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      setCouple(null)
      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        couple,
        loading,
        signIn,
        signUp,
        signOut,
        joinCouple,
        createCouple,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
