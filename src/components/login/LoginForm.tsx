import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  loginSchema,
  registerSchema,
  codeSchema,
  type LoginInput,
  type RegisterInput,
  type CodeInput,
} from '@/schemas/auth.schema'
import {
  requestLogin,
  verifyLogin,
  requestRegister,
  verifyRegister,
  EmailNotVerifiedError,
} from '@/services/auth.service'
import { useAuth } from '@/hooks/useAuth'
import { LoginCredentialsForm } from './forms/LoginCredentialsForm'
import { RegisterCredentialsForm } from './forms/RegisterCredentialsForm'
import { VerifyCodeForm } from './forms/VerifyCodeForm'

type Mode = 'login' | 'register'

export function LoginForm() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  // tracks which verify endpoint to call — may differ from mode when login
  // detects an unverified email and sends the user to the register verify flow
  const [pendingVerifyMode, setPendingVerifyMode] = useState<Mode>('login')

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })
  const verifyForm = useForm<CodeInput>({ resolver: zodResolver(codeSchema) })

  async function handleVerifySuccess(token: string) {
    auth.setAuth(token)
    navigate({ to: '/dashboard' })
  }

  const requestLoginMutation = useMutation({
    mutationFn: requestLogin,
    onSuccess: (_, vars) => {
      setPendingVerifyMode('login')
      setPendingEmail(vars.email)
    },
    onError: (err, vars) => {
      if (err instanceof EmailNotVerifiedError) {
        setPendingVerifyMode('register')
        setPendingEmail(vars.email)
      }
    },
  })

  const verifyLoginMutation = useMutation({
    mutationFn: verifyLogin,
    onSuccess: (data) => handleVerifySuccess(data.token),
  })

  const requestRegisterMutation = useMutation({
    mutationFn: requestRegister,
    onSuccess: (_, vars) => {
      setPendingVerifyMode('register')
      setPendingEmail(vars.email)
    },
  })

  const verifyRegisterMutation = useMutation({
    mutationFn: verifyRegister,
    onSuccess: (data) => handleVerifySuccess(data.token),
  })

  const credMutation = mode === 'login' ? requestLoginMutation : requestRegisterMutation
  const verifyMutation = pendingVerifyMode === 'login' ? verifyLoginMutation : verifyRegisterMutation

  function switchMode(next: Mode) {
    setMode(next)
    setPendingEmail(null)
    loginForm.reset()
    registerForm.reset()
    verifyForm.reset()
    requestLoginMutation.reset()
    requestRegisterMutation.reset()
    verifyLoginMutation.reset()
    verifyRegisterMutation.reset()
  }

  function goBack() {
    setPendingEmail(null)
    verifyForm.reset()
    verifyLoginMutation.reset()
    verifyRegisterMutation.reset()
  }

  if (pendingEmail) {
    const unverifiedHint =
      mode === 'login' && pendingVerifyMode === 'register'
        ? 'Seu email ainda não foi verificado. Use o código enviado durante o cadastro.'
        : undefined

    return (
      <VerifyCodeForm
        form={verifyForm}
        isPending={verifyMutation.isPending}
        isSuccess={verifyMutation.isSuccess}
        isError={verifyMutation.isError}
        error={verifyMutation.error}
        pendingEmail={pendingEmail}
        hint={unverifiedHint}
        onSubmit={({ code }) => verifyMutation.mutate({ email: pendingEmail, code })}
        onBack={goBack}
      />
    )
  }

  if (mode === 'login') {
    return (
      <LoginCredentialsForm
        form={loginForm}
        isPending={credMutation.isPending}
        isError={credMutation.isError && !(credMutation.error instanceof EmailNotVerifiedError)}
        error={credMutation.error}
        onSubmit={(data) => credMutation.mutate(data)}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
        onSwitchMode={() => switchMode('register')}
      />
    )
  }

  return (
    <RegisterCredentialsForm
      form={registerForm}
      isPending={credMutation.isPending}
      isError={credMutation.isError}
      error={credMutation.error}
      onSubmit={(data) => credMutation.mutate(data)}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSwitchMode={() => switchMode('login')}
    />
  )
}
