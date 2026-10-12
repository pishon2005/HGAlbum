import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const joinSchema = z.object({
  inviteCode: z.string().min(4, 'El código de invitación debe tener al menos 4 caracteres'),
})

export type JoinInput = z.infer<typeof joinSchema>

export const joinAndRegisterSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  inviteCode: z.string().min(4, 'El código de invitación debe tener al menos 4 caracteres'),
})

export type JoinAndRegisterInput = z.infer<typeof joinAndRegisterSchema>
