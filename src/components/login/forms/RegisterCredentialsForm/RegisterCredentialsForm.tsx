import type { UseFormReturn } from "react-hook-form";

import styles from "../styles/forms.shared.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import formFieldStyles from "@/components/ui/FormField/FormField.module.css";
import { UserIcon, LockIcon } from "@/components/ui/icons/icons";
import type { RegisterInput } from "@/schemas/auth.schema";
import { EmailTakenError } from "@/services/auth.service";

interface Props {
  form: UseFormReturn<RegisterInput>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onSubmit: (data: Pick<RegisterInput, "email" | "password">) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSwitchMode: () => void;
}

export function RegisterCredentialsForm({
  form,
  isPending,
  isError,
  error,
  onSubmit,
  showPassword,
  onTogglePassword,
  onSwitchMode,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;
  const btnLabel = isPending ? "⌛ CRIANDO" : "▶ CRIAR CONTA";
  const isEmailTaken = error instanceof EmailTakenError;

  return (
    <form
      onSubmit={handleSubmit(({ email, password }) =>
        onSubmit({ email, password }),
      )}
      noValidate
    >
      <FormField
        label="Identificação"
        htmlFor="reg-email"
        icon={<UserIcon />}
        error={errors.email?.message}
      >
        <input
          id="reg-email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Senha Secreta"
        htmlFor="reg-password"
        icon={<LockIcon />}
        error={errors.password?.message}
      >
        <input
          id="reg-password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("password")}
        />
        <Button
          variant="unstyled"
          type="button"
          className={formFieldStyles.togglePw}
          onClick={onTogglePassword}
        >
          {showPassword ? "OCULTAR" : "VER"}
        </Button>
      </FormField>

      <FormField
        label="Confirmar Senha"
        htmlFor="reg-confirm"
        icon={<LockIcon />}
        error={errors.confirmPassword?.message}
      >
        <input
          id="reg-confirm"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </FormField>

      <Button
        type="submit"
        disabled={isPending}
        state={isPending ? "loading" : "idle"}
      >
        {btnLabel}
      </Button>

      {isEmailTaken ? (
        <p className={styles.serverError}>
          Este email já está cadastrado.{" "}
          <a
            href="#"
            className={styles.errorLink}
            onClick={(e) => {
              e.preventDefault();
              onSwitchMode();
            }}
          >
            Fazer login
          </a>
        </p>
      ) : (
        isError && <p className={styles.serverError}>{error?.message}</p>
      )}

      <div className={styles.divider}>ou</div>
      <p className={styles.switchRow}>
        Já tem conta?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchMode();
          }}
        >
          Entrar
        </a>
      </p>
    </form>
  );
}
