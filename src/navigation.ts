export type TrainingLocation = {
  view: 'programs' | 'program' | 'browse';
  programId?: string;
  day?: number;
  browserView?: 'home' | 'results' | 'detail';
  exerciseId?: string;
  filters?: { query: string; category: string; equipment: string; target: string; page: number };
};

export type AppLocation = {
  mode: 'demo' | 'live';
  role: 'member' | 'expert' | 'admin';
  page: string;
  training?: TrainingLocation;
};

type HistoryEntry = AppLocation & { index: number; parent?: AppLocation };

export const readLocation = (): HistoryEntry | null => {
  const value = window.history.state?.healthyLife;
  return value && (value.mode === 'demo' || value.mode === 'live') && ['member','expert','admin'].includes(value.role) && typeof value.page === 'string' ? value as HistoryEntry : null;
};

const path = (value: AppLocation): AppLocation => ({ mode: value.mode, role: value.role, page: value.page, ...(value.training ? { training: value.training } : {}) });

export function replaceLocation(next: AppLocation, index = readLocation()?.index ?? 0) {
  const current = readLocation();
  window.history.replaceState({ ...window.history.state, healthyLife: { ...path(next), index, parent: current?.parent } }, '');
}

export function pushLocation(next: AppLocation) {
  const current = readLocation();
  if (!current) replaceLocation({ mode: 'demo', role: 'member', page: 'home' });
  const previous = readLocation()!;
  window.history.pushState({ ...window.history.state, healthyLife: { ...path(next), index: previous.index + 1, parent: path(previous) } }, '');
}

export function backTo(parentMatches: (parent: AppLocation) => boolean, fallback: () => void) {
  const current = readLocation();
  if (current?.parent && parentMatches(current.parent)) window.history.back();
  else fallback();
}

export function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}
