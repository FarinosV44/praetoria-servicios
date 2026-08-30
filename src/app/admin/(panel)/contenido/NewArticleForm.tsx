"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { CONTENT } from "@/config/content";
import { createArticleAction } from "@/server/actions/content";
import type { ArticleKind } from "@prisma/client";

export function NewArticleForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ArticleKind>("GUIA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (title.trim().length < 3) {
      setError("Indica un título.");
      return;
    }
    setBusy(true);
    const r = await createArticleAction({ title, kind });
    setBusy(false);
    if (r.ok) router.push(`/admin/contenido/${r.value.id}`);
    else setError("No se ha podido crear.");
  }

  return (
    <div>
      {error && <Alert tone="warning">{error}</Alert>}
      <Field label="Título" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
      <label>
        Tipo{" "}
        <select value={kind} onChange={(e) => setKind(e.currentTarget.value as ArticleKind)}>
          {(Object.keys(CONTENT.kindLabel) as ArticleKind[]).map((k) => (
            <option key={k} value={k}>
              {CONTENT.kindLabel[k]}
            </option>
          ))}
        </select>
      </label>
      <Button onClick={submit} loading={busy}>
        Crear borrador
      </Button>
    </div>
  );
}
