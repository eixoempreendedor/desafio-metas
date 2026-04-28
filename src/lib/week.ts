/**
 * Semana ISO 8601 no formato 'YYYY-Www' — ex: '2026-W17'.
 * Segunda = início da semana, domingo = fim.
 */
export function isoWeek(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Retorna a semana ISO da semana ANTERIOR à data informada. */
export function isoWeekPrev(d: Date = new Date()): string {
  const prev = new Date(d);
  prev.setUTCDate(prev.getUTCDate() - 7);
  return isoWeek(prev);
}

/** Formata data BR a partir de ISO 'YYYY-MM-DD'. */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Converte ISO week '2026-W18' para formato BR '2026-S18'. */
export function formatSemanaBR(isoWeekStr: string): string {
  return isoWeekStr.replace('-W', '-S');
}

/** % do ano corrido (0-100) na data informada. */
export function pctAnoCorrido(d: Date = new Date()): number {
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return ((d.getTime() - start) / (end - start)) * 100;
}
