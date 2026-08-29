/** Local draft persistence for the assistant (issue #5: recover on accidental reload). */

export interface DraftState {
  step: string;
  intent?: "problema" | "trabajo" | "seguro";
  triageRisks: string[];
  triageAcknowledged: boolean;
  trade?: string;
  clientChoseUnsure: boolean;
  requestId?: string;
  problemText: string;
  municipality: string;
  postalCode: string;
  analysisConfirmed: boolean;
  reference?: string;
  updatedAt: number;
}

const KEY = "praetoria.assistant.draft.v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed.updatedAt || Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(state: Omit<DraftState, "updatedAt">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    /* storage unavailable — the flow still works, just no recovery */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
