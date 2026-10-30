import { getSupabaseConfig } from "./config";

let lastCheck: { at: number; offline: boolean } | undefined;
let pendingCheck: Promise<boolean> | undefined;

export async function isOfflinePreview(): Promise<boolean> {
  const { url, key } = getSupabaseConfig();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)) return false;
  if (lastCheck && Date.now() - lastCheck.at < 3_000) return lastCheck.offline;
  if (!pendingCheck) {
    pendingCheck = (async () => {
      try {
        const response = await fetch(new URL("/auth/v1/health", parsed), {
          cache: "no-store",
          headers: { apikey: key },
          signal: AbortSignal.timeout(450),
        });
        return !response.ok;
      } catch {
        return true;
      }
    })().then((offline) => {
      lastCheck = { at: Date.now(), offline };
      return offline;
    }).finally(() => {
      pendingCheck = undefined;
    });
  }
  return pendingCheck;
}
