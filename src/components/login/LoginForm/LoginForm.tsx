import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";

import { LoginCredentialsForm } from "../forms/LoginCredentialsForm/LoginCredentialsForm";
import { RegisterCredentialsForm } from "../forms/RegisterCredentialsForm/RegisterCredentialsForm";
import { VerifyCodeForm } from "../forms/VerifyCodeForm/VerifyCodeForm";

import { useAuth } from "@/hooks/useAuth";
import {
  loginSchema,
  registerSchema,
  codeSchema,
  type LoginInput,
  type RegisterInput,
  type CodeInput,
} from "@/schemas/auth.schema";
import {
  requestLogin,
  verifyLogin,
  requestRegister,
  verifyRegister,
  resendRegistrationCode,
  getMe,
  EmailNotVerifiedError,
} from "@/services/auth.service";

type Mode = "login" | "register";

export function LoginForm() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingVerifyMode, setPendingVerifyMode] = useState<Mode>("login");
  const [resendFailed, setResendFailed] = useState(false);

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });
  const verifyForm = useForm<CodeInput>({ resolver: zodResolver(codeSchema) });

  async function handleVerifySuccess(token: string) {
    const user = await getMe(token);
    flushSync(() => auth.setAuth(token, user));
    navigate({ to: "/dashboard" });
  }

  const resendRegistrationCodeMutation = useMutation({
    mutationFn: resendRegistrationCode,
    onSuccess: (_, email) => {
      setResendFailed(false);
      setPendingVerifyMode("register");
      setPendingEmail(email);
    },
    onError: (_, email) => {
      setResendFailed(true);
      setPendingVerifyMode("register");
      setPendingEmail(email);
    },
  });

  const requestLoginMutation = useMutation({
    mutationFn: requestLogin,
    onSuccess: (_, vars) => {
      setPendingVerifyMode("login");
      setPendingEmail(vars.email);
    },
    onError: (err, vars) => {
      if (err instanceof EmailNotVerifiedError) {
        resendRegistrationCodeMutation.mutate(vars.email);
      }
    },
  });

  const verifyLoginMutation = useMutation({
    mutationFn: verifyLogin,
    onSuccess: (data) => handleVerifySuccess(data.token),
  });

  const requestRegisterMutation = useMutation({
    mutationFn: requestRegister,
    onSuccess: (_, vars) => {
      setPendingVerifyMode("register");
      setPendingEmail(vars.email);
    },
  });

  const verifyRegisterMutation = useMutation({
    mutationFn: verifyRegister,
    onSuccess: (data) => handleVerifySuccess(data.token),
  });

  const credMutation =
    mode === "login" ? requestLoginMutation : requestRegisterMutation;
  const verifyMutation =
    pendingVerifyMode === "login"
      ? verifyLoginMutation
      : verifyRegisterMutation;

  function switchMode(next: Mode) {
    setMode(next);
    setPendingEmail(null);
    setResendFailed(false);
    loginForm.reset();
    registerForm.reset();
    verifyForm.reset();
    requestLoginMutation.reset();
    requestRegisterMutation.reset();
    verifyLoginMutation.reset();
    verifyRegisterMutation.reset();
    resendRegistrationCodeMutation.reset();
  }

  function goBack() {
    setPendingEmail(null);
    setResendFailed(false);
    verifyForm.reset();
    verifyLoginMutation.reset();
    verifyRegisterMutation.reset();
    resendRegistrationCodeMutation.reset();
  }

  if (pendingEmail) {
    const unverifiedHint =
      mode === "login" && pendingVerifyMode === "register"
        ? resendFailed
          ? "Seu email ainda não foi verificado. Use o código enviado durante o cadastro."
          : "Seu email ainda não foi verificado. Um novo código foi enviado."
        : undefined;

    return (
      <VerifyCodeForm
        form={verifyForm}
        isPending={verifyMutation.isPending}
        isSuccess={verifyMutation.isSuccess}
        isError={verifyMutation.isError}
        error={verifyMutation.error}
        pendingEmail={pendingEmail}
        hint={unverifiedHint}
        onSubmit={({ code }) =>
          verifyMutation.mutate({ email: pendingEmail, code })
        }
        onBack={goBack}
      />
    );
  }

  const isResending = resendRegistrationCodeMutation.isPending;

  if (mode === "login") {
    return (
      <LoginCredentialsForm
        form={loginForm}
        isPending={credMutation.isPending || isResending}
        isError={
          credMutation.isError &&
          !(credMutation.error instanceof EmailNotVerifiedError) &&
          !isResending
        }
        error={credMutation.error}
        onSubmit={(data) => credMutation.mutate(data)}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
        onSwitchMode={() => switchMode("register")}
      />
    );
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
      onSwitchMode={() => switchMode("login")}
    />
  );
}
