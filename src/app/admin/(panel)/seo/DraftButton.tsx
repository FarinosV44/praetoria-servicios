"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui";
import { draftFromQueryAction } from "@/server/actions/seo";

/** "Crear borrador desde una consulta" — opens the CMS editor; never auto-publishes. */
export function DraftButton({ query }: { query: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="ghost"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const r = await draftFromQueryAction(query);
        setBusy(false);
        if (r.ok) router.push(`/admin/contenido/${r.value.id}`);
      }}
    >
      Crear borrador desde «{query.length > 40 ? `${query.slice(0, 40)}…` : query}»
    </Button>
  );
}
