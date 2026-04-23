import type { UseFormReturn } from "react-hook-form";

import styles from "../styles/forms.shared.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import formFieldStyles from "@/components/ui/FormField/FormField.module.css";
import { UserIcon, LockIcon } from "@/components/ui/icons/icons";
import type { LoginInput } from "@/schemas/auth.schema";

interface Props {
  form: UseFormReturn<LoginInput>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onSubmit: (data: LoginInput) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSwitchMode: () => void;
}

export function LoginCredentialsForm({
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
  const btnLabel = isPending ? "⌛ VERIFICANDO" : "▶ ENTRAR NO SISTEMA";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField
        label="Identificação"
        htmlFor="email"
        icon={<UserIcon />}
        error={errors.email?.message}
      >
        <input
          id="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Senha Secreta"
        htmlFor="password"
        icon={<LockIcon />}
        error={errors.password?.message}
      >
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
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

      <div className={styles.options}>
        <span />
        <a href="#" className={styles.forgot}>
          Esqueceu?
        </a>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        state={isPending ? "loading" : "idle"}
      >
        {btnLabel}
      </Button>

      {isError && <p className={styles.serverError}>{error?.message}</p>}

      <div className={styles.divider}>ou</div>
      <p className={styles.switchRow}>
        Novo caçador?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchMode();
          }}
        >
          Criar conta
        </a>
      </p>
    </form>
  );
}
