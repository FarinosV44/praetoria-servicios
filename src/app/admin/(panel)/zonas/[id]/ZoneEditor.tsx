"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { TRADES } from "@/config/trades";
import {
  setLocalPageNoindexAction,
  setLocalPageStatusAction,
  updateLocalPageAction,
} from "@/server/actions/localPage";
import styles from "../../../admin.module.css";

interface EditorZone {
  id: string;
  slug: string;
  municipality: string;
  serviceKey: string;
  status: string;
  noindex: boolean;
  intro: string;
  coverageNote: string;
  responseTimeNote: string;
  completedJobsNote: string;
  casePhotoNote: string;
  metaTitle: string;
  metaDescription: string;
  typicalServices: string;
  localFaq: string;
}

const NEXT_STATUS: Record<string, string[]> = {
  BORRADOR: ["PUBLICADO", "ARCHIVADO"],
  PUBLICADO: ["BORRADOR", "ARCHIVADO"],
  ARCHIVADO: ["BORRADOR", "PUBLICADO"],
};

export function ZoneEditor({ page }: { page: EditorZone }) {
  const router = useRouter();
  const [f, setF] = useState(page);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  const set =
    (k: keyof EditorZone) => (e: { currentTarget: { value: string } }) => {
      const v = e.currentTarget.value;
      setF((p) => ({ ...p, [k]: v }));
    };

  async function run(
    fn: () => Promise<{ ok: boolean; error?: { kind: string; message?: string } }>,
    okText: string,
  ) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: okText });
      router.refresh();
    } else {
      setMsg({ tone: "warning", text: r.error?.message ?? `Error (${r.error?.kind}).` });
    }
  }

  const save = () =>
    run(
      () =>
        updateLocalPageAction(page.id, {
          slug: f.slug,
          municipality: f.municipality,
          serviceKey: f.serviceKey || null,
          intro: f.intro,
          coverageNote: f.coverageNote,
          responseTimeNote: f.responseTimeNote,
          completedJobsNote: f.completedJobsNote,
          casePhotoNote: f.casePhotoNote,
          metaTitle: f.metaTitle,
          metaDescription: f.metaDescription,
          typicalServices: f.typicalServices,
          localFaq: f.localFaq,
        }),
      "Guardado.",
    );

  return (
    <div>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <section className={styles.card}>
        <h2>Datos de la zona</h2>
        <Field label="Municipio" value={f.municipality} onChange={set("municipality")} />
        <Field label="Slug (/zonas/…)" value={f.slug} onChange={set("slug")} />
        <label>
          Servicio principal (opcional){" "}
          <select
            value={f.serviceKey}
            onChange={(e) => setF((p) => ({ ...p, serviceKey: e.currentTarget.value }))}
          >
            <option value="">— sin servicio concreto —</option>
            {TRADES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <Field as="textarea" label="Introducción" value={f.intro} onChange={set("intro")} />
      </section>

      <section className={styles.card}>
        <h2>Contenido real y específico (define la indexación)</h2>
        <Field
          as="textarea"
          label="Nota de cobertura"
          hint="Qué se cubre exactamente en este municipio. Obligatoria para indexar."
          value={f.coverageNote}
          onChange={set("coverageNote")}
        />
        <Field
          label="Servicios más demandados aquí"
          hint="Claves de oficio separadas por comas: fontaneria, electricidad…"
          value={f.typicalServices}
          onChange={set("typicalServices")}
        />
        <Field
          as="textarea"
          label="Nota de tiempos de respuesta"
          value={f.responseTimeNote}
          onChange={set("responseTimeNote")}
        />
        <Field
          as="textarea"
          label="Trabajos realizados"
          value={f.completedJobsNote}
          onChange={set("completedJobsNote")}
        />
        <Field
          as="textarea"
          label="Nota sobre fotos autorizadas"
          value={f.casePhotoNote}
          onChange={set("casePhotoNote")}
        />
        <Field
          as="textarea"
          label="Preguntas frecuentes locales (JSON)"
          hint='Array: [{"q":"…","a":"…"}]'
          value={f.localFaq}
          onChange={set("localFaq")}
          style={{ minHeight: "10rem", fontFamily: "monospace" }}
        />
      </section>

      <section className={styles.card}>
        <h2>SEO</h2>
        <Field label="Meta título" value={f.metaTitle} onChange={set("metaTitle")} />
        <Field
          as="textarea"
          label="Meta descripción"
          value={f.metaDescription}
          onChange={set("metaDescription")}
        />
      </section>

      <Button onClick={save} loading={busy}>
        Guardar
      </Button>

      <section className={styles.card}>
        <h2>Publicación</h2>
        <p>
          Estado actual: <strong>{page.status}</strong>
        </p>
        {(NEXT_STATUS[page.status] ?? []).map((to) => (
          <Button
            key={to}
            variant="secondary"
            onClick={() =>
              run(() => setLocalPageStatusAction(page.id, { to }), `Estado → ${to}.`)
            }
            loading={busy}
          >
            Pasar a {to}
          </Button>
        ))}
        <label style={{ display: "block", marginTop: "1rem" }}>
          <input
            type="checkbox"
            checked={f.noindex}
            onChange={(e) => {
              const value = e.currentTarget.checked;
              setF((p) => ({ ...p, noindex: value }));
              run(() => setLocalPageNoindexAction(page.id, value), value ? "Marcada noindex." : "noindex retirado.");
            }}
          />{" "}
          Forzar <code>noindex</code> en esta página
        </label>
      </section>
    </div>
  );
}

