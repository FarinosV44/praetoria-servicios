"use client";

import { useActionState } from "react";
import { Alert, Button, Field } from "@/ui";
import { loginAction } from "@/server/actions/admin";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      {state.error && <Alert tone="warning">{state.error}</Alert>}
      <Field label="Correo" name="email" type="email" autoComplete="username" required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" fullWidth loading={pending}>
        Entrar
      </Button>
    </form>
  );
}
