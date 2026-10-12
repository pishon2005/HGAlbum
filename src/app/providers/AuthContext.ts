import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/entities/user'
import type { Couple } from '@/entities/couple'

export interface SignInParams {
  email: string
  password: string
}

export interface SignUpParams {
  fullName: string
  email: string
  password: string
  inviteCode?: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  couple: Couple | null
  loading: boolean
  signIn: (params: SignInParams) => Promise<{ error: Error | null }>
  signUp: (params: SignUpParams) => Promise<{ error: Error | null; user: User | null }>
  signOut: () => Promise<{ error: Error | null }>
  joinCouple: (inviteCode: string) => Promise<{ success: boolean; error: string | null }>
  createCouple: () => Promise<{ success: boolean; error: string | null }>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
