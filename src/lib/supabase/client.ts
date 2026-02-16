import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

// No-op lock pour éviter "AbortError: signal is aborted without reason"
// causé par l'API Navigator.locks lors des navigations
const lockNoOp = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: (...args: any[]) => Promise<R>
): Promise<R> => {
  return await fn();
};

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          lock: lockNoOp as any,
        },
      }
    );
  }
  return client;
}
