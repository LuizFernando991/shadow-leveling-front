import type { UseFormReturn } from "react-hook-form";

import styles from "../styles/forms.shared.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import { KeyIcon } from "@/components/ui/icons/icons";
import type { CodeInput } from "@/schemas/auth.schema";

interface Props {
  form: UseFormReturn<CodeInput>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  pendingEmail: string;
  hint?: string;
  onSubmit: (data: CodeInput) => void;
  onBack: () => void;
}

export function VerifyCodeForm({
  form,
  isPending,
  isSuccess,
  isError,
  error,
  pendingEmail,
  hint,
  onSubmit,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;
  const btnLabel = isPending
    ? "⌛ VERIFICANDO"
    : isSuccess
      ? "✓ ACESSO CONCEDIDO"
      : "▶ VERIFICAR CÓDIGO";
  const btnState = isPending ? "loading" : isSuccess ? "success" : "idle";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className={styles.codeInfo}>
        Código enviado para <strong>{pendingEmail}</strong>
      </p>

      {hint && <p className={styles.hint}>{hint}</p>}

      <FormField
        label="Código de Verificação"
        htmlFor="code"
        icon={<KeyIcon />}
        error={errors.code?.message}
      >
        <input
          id="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          {...register("code")}
        />
      </FormField>

      <Button type="submit" disabled={isPending || isSuccess} state={btnState}>
        {btnLabel}
      </Button>

      {isError && <p className={styles.serverError}>{error?.message}</p>}

      <Button type="button" variant="text" onClick={onBack}>
        ← Voltar
      </Button>
    </form>
  );
}
