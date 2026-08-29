"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { formatEuros, parseEuros } from "@/lib/money";
import { computeTotals } from "@/domain/quotes/compute";
import { saveQuoteAction, sendQuoteAction } from "@/server/actions/quotes";
import styles from "../../../../admin.module.css";

type LineKind =
  | "VISITA"
  | "DESPLAZAMIENTO"
  | "MANO_OBRA"
  | "MATERIALES"
  | "PREPARACION"
  | "RETIRADA_LIMPIEZA"
  | "OTRO";

interface Line {
  kind: LineKind;
  concept: string;
  amount: string;
  included: boolean;
}

const KIND_LABEL: Record<LineKind, string> = {
  VISITA: "Visita / diagnóstico",
  DESPLAZAMIENTO: "Desplazamiento",
  MANO_OBRA: "Mano de obra",
  MATERIALES: "Materiales",
  PREPARACION: "Trabajos preparatorios",
  RETIRADA_LIMPIEZA: "Retirada y limpieza",
  OTRO: "Otro",
};

type InitialQuote = {
  workDescription: string;
  taxRateBps: number;
  isEstimate: boolean;
  maxTotalCents: number | null;
  exclusionsNote: string | null;
  assumptions: string[];
  extrasApprovalNote: string | null;
  preparatoryNote: string | null;
  professionalRef: string | null;
  verificationScope: string | null;
  scheduledFor: Date | null;
  durationEstimate: string | null;
  warrantyText: string | null;
  warrantyResponsible: string | null;
  estimatedTimeframe: string | null;
  validUntil: Date | null;
  observations: string | null;
  visitFeeDiscounted: boolean;
  id: string;
  lines: { kind: LineKind; concept: string; amountCents: number; included: boolean }[];
} | null;

const euros = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2));
const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export function QuoteEditor({ reference, initial }: { reference: string; initial: InitialQuote }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "info" | "success" | "warning"; text: string } | null>(
    null,
  );
  const [missing, setMissing] = useState<string[]>([]);
  const [quoteId, setQuoteId] = useState<string | null>(initial?.id ?? null);

  const [workDescription, setWork] = useState(initial?.workDescription ?? "");
  const [lines, setLines] = useState<Line[]>(
    initial?.lines.map((l) => ({
      kind: l.kind,
      concept: l.concept,
      amount: euros(l.amountCents),
      included: l.included,
    })) ?? [{ kind: "MANO_OBRA", concept: "", amount: "", included: true }],
  );
  const [taxRate, setTaxRate] = useState(String((initial?.taxRateBps ?? 2100) / 100));
  const [isEstimate, setIsEstimate] = useState(initial?.isEstimate ?? false);
  const [maxTotal, setMaxTotal] = useState(euros(initial?.maxTotalCents ?? null));
  const [exclusions, setExclusions] = useState(initial?.exclusionsNote ?? "");
  const [assumptions, setAssumptions] = useState((initial?.assumptions ?? []).join("\n"));
  const [extrasApproval, setExtrasApproval] = useState(
    initial?.extrasApprovalNote ??
      "Ningún trabajo adicional se realiza ni se cobra sin tu aprobación por escrito.",
  );
  const [professionalRef, setProfRef] = useState(initial?.professionalRef ?? "");
  const [verificationScope, setVerScope] = useState(initial?.verificationScope ?? "");
  const [scheduledFor, setScheduled] = useState(dateInput(initial?.scheduledFor ?? null));
  const [durationEstimate, setDuration] = useState(initial?.durationEstimate ?? "");
  const [warrantyText, setWarranty] = useState(initial?.warrantyText ?? "");
  const [warrantyResponsible, setWarrRespo] = useState(
    initial?.warrantyResponsible ?? "Praetoria Servicios",
  );
  const [estimatedTimeframe, setTimeframe] = useState(initial?.estimatedTimeframe ?? "");
  const [validUntil, setValidUntil] = useState(dateInput(initial?.validUntil ?? null));
  const [observations, setObs] = useState(initial?.observations ?? "");

  const totals = useMemo(() => {
    try {
      return computeTotals(
        lines.map((l) => ({
          concept: l.concept,
          amountCents: l.amount.trim() ? parseEuros(l.amount) : 0,
          included: l.included,
        })),
        Math.round(Number(taxRate || "0") * 100),
      );
    } catch {
      return null;
    }
  }, [lines, taxRate]);

  function payload() {
    return {
      workDescription,
      lines: lines.map((l) => ({
        kind: l.kind,
        concept: l.concept,
        amount: l.amount,
        included: l.included,
      })),
      taxRateBps: Math.round(Number(taxRate || "0") * 100),
      isEstimate,
      maxTotal,
      visitFeeDiscounted: initial?.visitFeeDiscounted ?? false,
      exclusionsNote: exclusions,
      assumptions: assumptions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      extrasApprovalNote: extrasApproval,
      professionalRef,
      verificationScope,
      scheduledFor: scheduledFor || undefined,
      durationEstimate,
      warrantyText,
      warrantyResponsible,
      estimatedTimeframe,
      validUntil: validUntil || undefined,
      observations,
    };
  }

  function save(then?: "send") {
    setMsg(null);
    setMissing([]);
    start(async () => {
      const r = await saveQuoteAction(reference, payload());
      if (!r.ok) {
        setMsg({ tone: "warning", text: "No se pudo guardar. Revisa los campos." });
        return;
      }
      setQuoteId(r.value.id);
      if (then === "send") {
        const s = await sendQuoteAction(reference, r.value.id);
        if (!s.ok) {
          if (s.error.kind === "incomplete") {
            setMissing(s.error.missing ?? []);
            setMsg({
              tone: "warning",
              text: "Faltan datos obligatorios para enviar el presupuesto:",
            });
          } else {
            setMsg({ tone: "warning", text: `No se pudo enviar: ${s.error.kind}` });
          }
          return;
        }
        setMsg({
          tone: "success",
          text: "Presupuesto enviado. La solicitud pasa a PRESUPUESTO_ENVIADO.",
        });
        router.push(`/admin/solicitudes/${reference}`);
        return;
      }
      setMsg({ tone: "success", text: `Borrador v${r.value.version} guardado.` });
      router.refresh();
    });
  }

  return (
    <section className={styles.card}>
      <h2>{quoteId ? "Editar borrador" : "Nuevo presupuesto"}</h2>
      {msg && (
        <Alert tone={msg.tone}>
          {msg.text}
          {missing.length > 0 && (
            <ul>
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <Field
        as="textarea"
        label="Descripción de los trabajos incluidos"
        value={workDescription}
        onChange={(e) => setWork(e.currentTarget.value)}
        required
      />

      <h3>Líneas (desglose)</h3>
      <p className={styles.smallprint}>
        Incluye desplazamiento, mano de obra, materiales, preparación y limpieza. Marca las líneas
        que NO se cobran para que el cliente vea qué está y qué no está incluido.
      </p>
      {lines.map((l, i) => (
        <div key={i} className={styles.quoteLine}>
          <select
            value={l.kind}
            onChange={(e) =>
              setLines((p) =>
                p.map((x, j) => (j === i ? { ...x, kind: e.target.value as LineKind } : x)),
              )
            }
          >
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            placeholder="Concepto"
            value={l.concept}
            onChange={(e) =>
              setLines((p) => p.map((x, j) => (j === i ? { ...x, concept: e.target.value } : x)))
            }
          />
          <input
            placeholder="0,00 €"
            inputMode="decimal"
            value={l.amount}
            onChange={(e) =>
              setLines((p) => p.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
            }
          />
          <label>
            <input
              type="checkbox"
              checked={l.included}
              onChange={(e) =>
                setLines((p) =>
                  p.map((x, j) => (j === i ? { ...x, included: e.target.checked } : x)),
                )
              }
            />{" "}
            se cobra
          </label>
          <button
            type="button"
            onClick={() => setLines((p) => p.filter((_, j) => j !== i))}
            aria-label="Quitar línea"
          >
            ✕
          </button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="md"
        onClick={() =>
          setLines((p) => [...p, { kind: "OTRO", concept: "", amount: "", included: true }])
        }
      >
        Añadir línea
      </Button>

      <div className={styles.totals}>
        <label>
          IVA (%)
          <input value={taxRate} inputMode="decimal" onChange={(e) => setTaxRate(e.target.value)} />
        </label>
        {totals ? (
          <p>
            Subtotal {formatEuros(totals.subtotalCents)} · IVA {formatEuros(totals.taxCents)} ·{" "}
            <strong>Total {formatEuros(totals.totalCents)}</strong>
          </p>
        ) : (
          <p className={styles.smallprint}>Revisa los importes.</p>
        )}
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={isEstimate}
          onChange={(e) => setIsEstimate(e.currentTarget.checked)}
        />
        Es una estimación (no precio cerrado)
      </label>
      {isEstimate && (
        <Field
          label="Total máximo"
          inputMode="decimal"
          value={maxTotal}
          onChange={(e) => setMaxTotal(e.currentTarget.value)}
          hint="Obligatorio al ser estimación"
        />
      )}

      <Field
        as="textarea"
        label="Qué NO está incluido"
        value={exclusions}
        onChange={(e) => setExclusions(e.currentTarget.value)}
      />
      <Field
        as="textarea"
        label="Supuestos que podrían modificar el precio (uno por línea)"
        value={assumptions}
        onChange={(e) => setAssumptions(e.currentTarget.value)}
      />
      <Field
        as="textarea"
        label="Procedimiento de aprobación de extras"
        value={extrasApproval}
        onChange={(e) => setExtrasApproval(e.currentTarget.value)}
      />
      <Field
        label="Profesional asignado / referencia"
        value={professionalRef}
        onChange={(e) => setProfRef(e.currentTarget.value)}
        required
      />
      <Field
        label="Alcance de la verificación del profesional"
        value={verificationScope}
        onChange={(e) => setVerScope(e.currentTarget.value)}
        hint="Ej.: identidad y seguro de RC verificados"
      />
      <div className={styles.twoCol}>
        <Field
          label="Fecha / franja"
          type="date"
          value={scheduledFor}
          onChange={(e) => setScheduled(e.currentTarget.value)}
        />
        <Field
          label="Duración estimada"
          value={durationEstimate}
          onChange={(e) => setDuration(e.currentTarget.value)}
        />
      </div>
      <Field
        label="Plazo estimado (si no hay fecha)"
        value={estimatedTimeframe}
        onChange={(e) => setTimeframe(e.currentTarget.value)}
      />
      <Field
        as="textarea"
        label="Garantía aplicable"
        value={warrantyText}
        onChange={(e) => setWarranty(e.currentTarget.value)}
        required
      />
      <Field
        label="Responsable de la garantía"
        value={warrantyResponsible}
        onChange={(e) => setWarrRespo(e.currentTarget.value)}
        required
      />
      <Field
        label="Validez de la oferta"
        type="date"
        value={validUntil}
        onChange={(e) => setValidUntil(e.currentTarget.value)}
        required
      />
      <Field
        as="textarea"
        label="Observaciones"
        value={observations}
        onChange={(e) => setObs(e.currentTarget.value)}
      />

      <div className={styles.nav}>
        <Button variant="secondary" onClick={() => save()} loading={pending}>
          Guardar borrador
        </Button>
        <Button onClick={() => save("send")} loading={pending}>
          Guardar y marcar como enviado
        </Button>
      </div>
    </section>
  );
}
