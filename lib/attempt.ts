// Run one data source so its failure shows as a message instead of blanking the page.
export type Attempt<T> = { data: T; error: null } | { data: null; error: string };

export async function attempt<T>(fn: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { data: await fn(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
