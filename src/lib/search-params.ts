/** Read a single string value from Next.js searchParams. */
export function param(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.length <= 512 ? s : undefined;
}
