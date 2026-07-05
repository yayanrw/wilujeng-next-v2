export const STORE_TZ = 'Asia/Jakarta'; // WIB, fixed UTC+7, no DST

/** "today" (or any instant) as YYYY-MM-DD in store-local time. */
export function localDateStr(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: STORE_TZ }).format(d);
}

/**
 * Given a YYYY-MM-DD string meant as a store-local calendar day, return the
 * UTC instant range [start, end) covering that whole day. Explicit +07:00
 * offset sidesteps server-process timezone entirely (WIB has no DST).
 */
export function dayBoundsUtc(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
