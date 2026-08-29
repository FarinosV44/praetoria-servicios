"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Field,
  IntentCards,
  Mascot,
  SafetyAlert,
  Spinner,
  Stepper,
  type Intent,
} from "@/ui";
import { PhotoUpload } from "@/ui/patterns/PhotoUpload";
import { TradeCards } from "@/ui/patterns/TradeCards";
import { TRIAGE_RISKS, instructionsFor, isEmergency } from "@/domain/assistant/triage";
import { createDraftAction, describeProblemAction } from "@/server/actions/requests";
import {
  finishRequestAction,
  recordCorrectionAction,
  runAnalysisAction,
} from "@/server/actions/assistant";
import type { AnalysisView } from "@/server/services/analysis";
import { COPY } from "@/config/copy";
import { loadDraft, saveDraft, clearDraft, type DraftState } from "./draft-storage";
import { AnalysisPanel } from "./AnalysisPanel";
import { ContactStep } from "./ContactStep";
import styles from "./assistant.module.css";

type Step =
  | "intent"
  | "triage"
  | "category"
  | "photos"
  | "describe"
  | "analysis"
  | "validate"
  | "contact"
  | "done";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "category", label: "Categoría" },
  { key: "photos", label: "Fotos" },
  { key: "describe", label: "Explicación" },
  { key: "analysis", label: "Análisis" },
  { key: "validate", label: "Revisión" },
  { key: "contact", label: "Contacto" },
];

export function Assistant({ startInsurance }: { startInsurance: boolean }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("intent");
  const [intent, setIntent] = useState<Intent | undefined>(startInsurance ? "seguro" : undefined);
  const [triageRisks, setTriageRisks] = useState<string[]>([]);
  const [triageAck, setTriageAck] = useState(false);
  const [trade, setTrade] = useState<string | undefined>();
  const [clientChoseUnsure, setUnsure] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [photoCount, setPhotoCount] = useState(0);
  const [problemText, setProblemText] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [coverage, setCoverage] = useState<boolean | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null);
  const [analysisConfirmed, setAnalysisConfirmed] = useState(false);
  const [reference, setReference] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reanalyses, setReanalyses] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Recover a local draft on mount (one-time hydration from localStorage — the
  // "hydrated" flag guards against a server/client mismatch).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const d = loadDraft();
    if (d) {
      setStep(d.step as Step);
      setIntent(d.intent);
      setTriageRisks(d.triageRisks);
      setTriageAck(d.triageAcknowledged);
      setTrade(d.trade);
      setUnsure(d.clientChoseUnsure);
      setRequestId(d.requestId);
      setProblemText(d.problemText);
      setMunicipality(d.municipality);
      setPostalCode(d.postalCode);
      setAnalysisConfirmed(d.analysisConfirmed);
      setReference(d.reference);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return;
    const state: Omit<DraftState, "updatedAt"> = {
      step,
      intent,
      triageRisks,
      triageAcknowledged: triageAck,
      trade,
      clientChoseUnsure,
      requestId,
      problemText,
      municipality,
      postalCode,
      analysisConfirmed,
      reference,
    };
    if (step === "done") clearDraft();
    else saveDraft(state);
  }, [
    hydrated,
    step,
    intent,
    triageRisks,
    triageAck,
    trade,
    clientChoseUnsure,
    requestId,
    problemText,
    municipality,
    postalCode,
    analysisConfirmed,
    reference,
  ]);

  // Move focus to the step heading on change (screen-reader + keyboard).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const ensureDraft = useCallback(async (): Promise<string | null> => {
    if (requestId) return requestId;
    const r = await createDraftAction({ trade, clientChoseUnsure });
    if (!r.ok) {
      setError(COPY.common.errorGeneric);
      return null;
    }
    setRequestId(r.value.id);
    return r.value.id;
  }, [requestId, trade, clientChoseUnsure]);

  const currentStepperIndex = useMemo(
    () =>
      Math.max(
        0,
        STEP_LABELS.findIndex((s) => s.key === step),
      ),
    [step],
  );

  async function goToDescribeThenSave() {
    setError(null);
    if (problemText.trim().length < 10) {
      setError("Cuéntanos un poco más sobre el problema (al menos una frase).");
      return;
    }
    if (!/^\d{5}$/.test(postalCode) || municipality.trim().length < 2) {
      setError("Necesitamos el municipio y un código postal de 5 dígitos.");
      return;
    }
    setBusy(true);
    const id = await ensureDraft();
    if (!id) return setBusy(false);
    const r = await describeProblemAction(id, { problemText, municipality, postalCode });
    setBusy(false);
    if (!r.ok) {
      setError("Revisa los datos e inténtalo de nuevo.");
      return;
    }
    setCoverage(r.value.withinCoverage);
    setStep("analysis");
    void runAnalysis(id);
  }

  const runAnalysis = useCallback(async (id: string) => {
    setBusy(true);
    setError(null);
    setAnalysis(null);
    const r = await runAnalysisAction(id);
    setBusy(false);
    if (!r.ok) {
      if (r.error.kind === "too_many_reanalyses") {
        setError("Has pedido varios análisis. Enviamos la solicitud y la revisa una persona.");
      } else {
        setError(
          "El análisis automático no está disponible ahora. Puedes enviar la solicitud igualmente y la revisará una persona.",
        );
      }
      setAnalysis({
        version: 0,
        outcome: "PROVIDER_ERROR",
        result: null,
        confidence: null,
        requiresOnSiteInspection: false,
      });
      return;
    }
    setAnalysis(r.value);
  }, []);

  async function submitCorrection(wrongSections: string[], clarification: string) {
    if (!requestId) return;
    setBusy(true);
    await recordCorrectionAction(requestId, { wrongSections, clarification });
    setReanalyses((n) => n + 1);
    setBusy(false);
    setStep("analysis");
    void runAnalysis(requestId);
  }

  async function finish(contact: unknown) {
    if (!requestId) return { ok: false as const, fieldErrors: undefined };
    setBusy(true);
    const r = await finishRequestAction(requestId, {
      contact,
      analysisConfirmed,
      triageRisks,
    });
    setBusy(false);
    if (!r.ok) {
      return { ok: false as const, fieldErrors: r.error.fieldErrors };
    }
    setReference(r.value.reference);
    setStep("done");
    return { ok: true as const, fieldErrors: undefined };
  }

  if (!hydrated) {
    return (
      <div className={styles.wrap}>
        <Spinner label="Cargando" />
      </div>
    );
  }

  const showStepper = [
    "category",
    "photos",
    "describe",
    "analysis",
    "validate",
    "contact",
  ].includes(step);

  return (
    <div className={styles.wrap}>
      {step === "done" && reference ? (
        <DonePanel
          reference={reference}
          coverage={coverage}
          onNew={() => {
            clearDraft();
            router.push("/");
          }}
        />
      ) : (
        <>
          {showStepper && (
            <Stepper
              steps={STEP_LABELS.map((s) => ({ key: s.key, label: s.label }))}
              current={currentStepperIndex}
            />
          )}

          <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
            {headingFor(step)}
          </h1>

          {error && <Alert tone="warning">{error}</Alert>}

          {step === "intent" && (
            <>
              <p className={styles.lead}>
                No necesitas saber a quién llamar. Empieza por lo que mejor describa tu caso.
              </p>
              <IntentCards
                onSelect={(i) => {
                  setIntent(i);
                  setStep("triage");
                }}
              />
            </>
          )}

          {step === "triage" && (
            <TriageStep
              risks={triageRisks}
              acknowledged={triageAck}
              onToggle={(k) =>
                setTriageRisks((prev) =>
                  prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                )
              }
              onAck={setTriageAck}
              onBack={() => setStep("intent")}
              onNext={() => setStep(intent === "seguro" ? "category" : "category")}
            />
          )}

          {step === "category" && (
            <>
              <p className={styles.lead}>
                Elige la opción más cercana. Si no lo tienes claro, usa la primera.
              </p>
              <TradeCards
                onSelect={(key) => {
                  setTrade(key === "no-se" ? undefined : key);
                  setUnsure(key === "no-se");
                  setStep("photos");
                }}
              />
              <div className={styles.nav}>
                <Button variant="ghost" onClick={() => setStep("triage")}>
                  {COPY.common.back}
                </Button>
              </div>
            </>
          )}

          {step === "photos" && (
            <PhotosStep
              requestId={requestId}
              ensureDraft={ensureDraft}
              onCountChange={setPhotoCount}
              onBack={() => setStep("category")}
              onNext={() => setStep("describe")}
              count={photoCount}
            />
          )}

          {step === "describe" && (
            <>
              <Field
                as="textarea"
                label="¿Qué ocurre?"
                hint="Cuéntalo con tus palabras: qué pasa, desde cuándo y dónde."
                value={problemText}
                onChange={(e) => setProblemText(e.currentTarget.value)}
                required
              />
              <div className={styles.locationRow}>
                <Field
                  label="Municipio"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.currentTarget.value)}
                  required
                />
                <Field
                  label="Código postal"
                  inputMode="numeric"
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(e.currentTarget.value.replace(/\D/g, "").slice(0, 5))
                  }
                  required
                />
              </div>
              <div className={styles.nav}>
                <Button variant="ghost" onClick={() => setStep("photos")}>
                  {COPY.common.back}
                </Button>
                <Button onClick={goToDescribeThenSave} loading={busy}>
                  {COPY.common.next}
                </Button>
              </div>
            </>
          )}

          {step === "analysis" && (
            <>
              {busy || !analysis ? (
                <div className={styles.analysing}>
                  <Mascot mood="progress" size={80} label="Analizando" />
                  <Spinner label="Estamos leyendo tu caso" />
                  <p>{COPY.disclaimers.aiOrientative}</p>
                </div>
              ) : (
                <AnalysisPanel
                  analysis={analysis}
                  onContinue={() => setStep("validate")}
                  onRetry={() => requestId && runAnalysis(requestId)}
                />
              )}
            </>
          )}

          {step === "validate" && analysis && (
            <ValidateStep
              analysis={analysis}
              canReanalyse={reanalyses < 3}
              onConfirm={() => {
                setAnalysisConfirmed(true);
                setStep("contact");
              }}
              onCorrect={submitCorrection}
              onHumanReview={() => {
                setAnalysisConfirmed(false);
                setStep("contact");
              }}
              busy={busy}
            />
          )}

          {step === "contact" && (
            <ContactStep
              defaultChannel={intent === "seguro" ? "EMAIL" : "WHATSAPP"}
              onSubmit={finish}
              onBack={() => setStep(analysis ? "validate" : "describe")}
              busy={busy}
            />
          )}
        </>
      )}
    </div>
  );
}

function headingFor(step: Step): string {
  switch (step) {
    case "intent":
      return "¿Con qué necesitas ayuda?";
    case "triage":
      return "Antes de seguir, tu seguridad";
    case "category":
      return "¿Qué tipo de problema es?";
    case "photos":
      return "Añade unas fotos";
    case "describe":
      return "Cuéntanos qué ocurre";
    case "analysis":
      return "Estamos analizando tu caso";
    case "validate":
      return "¿Lo hemos entendido bien?";
    case "contact":
      return "¿Cómo te contactamos?";
    default:
      return "";
  }
}

function TriageStep({
  risks,
  acknowledged,
  onToggle,
  onAck,
  onBack,
  onNext,
}: {
  risks: string[];
  acknowledged: boolean;
  onToggle: (k: string) => void;
  onAck: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const emergency = isEmergency(risks);
  const instructions = instructionsFor(risks);
  return (
    <>
      <p className={styles.lead}>
        Marca lo que aplique. Si hay peligro, te damos indicaciones y a quién llamar.
      </p>
      <fieldset className={styles.fieldset}>
        <legend className={styles.srOnly}>Situaciones de riesgo</legend>
        {TRIAGE_RISKS.map((r) => (
          <label key={r.key} className={styles.check}>
            <input
              type="checkbox"
              checked={risks.includes(r.key)}
              onChange={() => onToggle(r.key)}
            />
            <span>{r.label}</span>
          </label>
        ))}
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={risks.length === 0}
            onChange={() => risks.forEach((k) => onToggle(k))}
          />
          <span>Nada de esto, es un problema normal</span>
        </label>
      </fieldset>

      {instructions.length > 0 && (
        <SafetyAlert
          heading={emergency ? "Esto puede ser urgente" : "Ten cuidado con esto"}
          instructions={instructions}
        />
      )}

      {emergency && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onAck(e.currentTarget.checked)}
          />
          <span>
            He leído las indicaciones. Quiero seguir para dejar constancia de mi solicitud.
          </span>
        </label>
      )}

      <div className={styles.nav}>
        <Button variant="ghost" onClick={onBack}>
          {COPY.common.back}
        </Button>
        <Button onClick={onNext} disabled={emergency && !acknowledged}>
          {COPY.common.next}
        </Button>
      </div>
    </>
  );
}

function PhotosStep({
  requestId,
  ensureDraft,
  onCountChange,
  onBack,
  onNext,
  count,
}: {
  requestId: string | undefined;
  ensureDraft: () => Promise<string | null>;
  onCountChange: (n: number) => void;
  onBack: () => void;
  onNext: () => void;
  count: number;
}) {
  const [id, setId] = useState<string | undefined>(requestId);
  useEffect(() => {
    if (!id) ensureDraft().then((v) => v && setId(v));
  }, [id, ensureDraft]);

  return (
    <>
      <p className={styles.lead}>
        Una foto general y otra de detalle nos ayudan mucho. Puedes saltarte este paso si no puedes
        hacerlas ahora.
      </p>
      {id ? (
        <PhotoUpload requestId={id} onCountChange={onCountChange} />
      ) : (
        <Spinner label="Preparando" />
      )}
      <div className={styles.nav}>
        <Button variant="ghost" onClick={onBack}>
          {COPY.common.back}
        </Button>
        <Button onClick={onNext}>{count > 0 ? COPY.common.next : "Continuar sin fotos"}</Button>
      </div>
    </>
  );
}

function ValidateStep({
  analysis,
  canReanalyse,
  onConfirm,
  onCorrect,
  onHumanReview,
  busy,
}: {
  analysis: AnalysisView;
  canReanalyse: boolean;
  onConfirm: () => void;
  onCorrect: (wrongSections: string[], clarification: string) => void;
  onHumanReview: () => void;
  busy: boolean;
}) {
  const [correcting, setCorrecting] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [text, setText] = useState("");

  const sections = [
    { key: "resumen", label: "Lo que habéis entendido" },
    { key: "solucion", label: "La solución orientativa" },
    { key: "oficio", label: "El profesional recomendado" },
    { key: "urgencia", label: "La urgencia" },
  ];

  if (analysis.outcome === "PROVIDER_ERROR") {
    return (
      <>
        <Alert tone="info">
          No hemos podido analizarlo automáticamente. Puedes enviar la solicitud y la revisa una
          persona.
        </Alert>
        <div className={styles.nav}>
          <Button onClick={onHumanReview}>Que lo revise una persona</Button>
        </div>
      </>
    );
  }

  return (
    <>
      {!correcting ? (
        <div className={styles.nav}>
          <Button onClick={onConfirm}>Sí, es correcto</Button>
          <Button variant="secondary" onClick={() => setCorrecting(true)}>
            No del todo
          </Button>
        </div>
      ) : (
        <div>
          <p className={styles.lead}>¿Qué parte no encaja?</p>
          <fieldset className={styles.fieldset}>
            <legend className={styles.srOnly}>Apartados incorrectos</legend>
            {sections.map((s) => (
              <label key={s.key} className={styles.check}>
                <input
                  type="checkbox"
                  checked={wrong.includes(s.key)}
                  onChange={() =>
                    setWrong((p) =>
                      p.includes(s.key) ? p.filter((x) => x !== s.key) : [...p, s.key],
                    )
                  }
                />
                <span>{s.label}</span>
              </label>
            ))}
          </fieldset>
          <Field
            as="textarea"
            label="Explícanoslo con tus palabras"
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <div className={styles.nav}>
            <Button variant="ghost" onClick={() => setCorrecting(false)}>
              Volver
            </Button>
            {canReanalyse ? (
              <Button onClick={() => onCorrect(wrong, text)} loading={busy}>
                Analizar de nuevo
              </Button>
            ) : (
              <Button onClick={onHumanReview}>Que lo revise una persona</Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DonePanel({
  reference,
  coverage,
  onNew,
}: {
  reference: string;
  coverage: boolean | null;
  onNew: () => void;
}) {
  return (
    <div className={styles.done}>
      <Mascot mood="relief" size={96} label="Solicitud enviada" />
      <h1 className={styles.heading}>Solicitud recibida</h1>
      <p className={styles.lead}>
        Tu referencia es <strong>{reference}</strong>. Guárdala.
      </p>
      <p>{COPY.disclaimers.responseTime}</p>
      {coverage === false && (
        <Alert tone="info">
          Tu zona está fuera de nuestra cobertura habitual. Revisaremos si podemos ayudarte
          igualmente y te lo diremos al responderte.
        </Alert>
      )}
      <p className={styles.smallprint}>
        Tu solicitud no se vende ni se envía a varios profesionales. Un solo interlocutor se ocupa
        de ella.
      </p>
      <Button onClick={onNew}>Volver al inicio</Button>
    </div>
  );
}
