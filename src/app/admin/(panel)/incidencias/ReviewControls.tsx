"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui";
import { authorizeReviewAction } from "@/server/actions/incidences";

export function ReviewControls({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "AUTORIZADA" | "RECHAZADA") {
    setBusy(true);
    const r = await authorizeReviewAction(id, decision);
    setBusy(false);
    if (r.ok) router.refresh();
  }

  return (
    <span style={{ display: "inline-flex", gap: "0.5rem" }}>
      <Button loading={busy} onClick={() => decide("AUTORIZADA")}>
        Autorizar publicación
      </Button>
      <Button variant="ghost" loading={busy} onClick={() => decide("RECHAZADA")}>
        No publicar
      </Button>
    </span>
  );
}
