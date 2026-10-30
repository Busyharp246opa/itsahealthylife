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

export const shellPath = (role: AppLocation['role']) => role === 'expert' ? '/experts' : `/${role}`;

export const shellRole = (pathname = window.location.pathname): AppLocation['role'] => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/admin' ? 'admin' : normalized === '/experts' ? 'expert' : 'member';
};

type HistoryEntry = AppLocation & { index: number; parent?: AppLocation };

export const readLocation = (): HistoryEntry | null => {
  const value = window.history.state?.healthyLife;
  return value && (value.mode === 'demo' || value.mode === 'live') && ['member','expert','admin'].includes(value.role) && typeof value.page === 'string' ? value as HistoryEntry : null;
};

const path = (value: AppLocation): AppLocation => ({ mode: value.mode, role: value.role, page: value.page, ...(value.training ? { training: value.training } : {}) });

export function replaceLocation(next: AppLocation, index = readLocation()?.index ?? 0) {
  const current = readLocation();
  const url = next.mode === 'live' ? `${shellPath(next.role)}${window.location.search}${window.location.hash}` : undefined;
  window.history.replaceState({ ...window.history.state, healthyLife: { ...path(next), index, parent: current?.parent } }, '', url);
}

export function pushLocation(next: AppLocation) {
  const current = readLocation();
  if (!current) replaceLocation({ mode: next.mode, role: next.role, page: 'home' });
  const previous = readLocation()!;
  window.history.pushState({ ...window.history.state, healthyLife: { ...path(next), index: previous.index + 1, parent: path(previous) } }, '', next.mode === 'live' ? shellPath(next.role) : undefined);
}

export function backTo(parentMatches: (parent: AppLocation) => boolean, fallback: () => void) {
  const current = readLocation();
  if (current?.parent && parentMatches(current.parent)) window.history.back();
  else fallback();
}

export function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}
