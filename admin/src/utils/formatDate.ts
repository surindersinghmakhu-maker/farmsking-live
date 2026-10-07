/**
 * Formats any ISO date string (YYYY-MM-DD or ISO timestamp) or Date object into clean DD/MM/YYYY format.
 * Example: '2026-09-01' or '2026-09-01T14:41:22.000Z' -> '01/09/2026'
 */
export function formatDateDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  // Already formatted as DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // ISO string: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  let cleanStr = str;
  if (cleanStr.includes('T')) {
    cleanStr = cleanStr.split('T')[0];
  } else if (cleanStr.includes(' ')) {
    cleanStr = cleanStr.split(' ')[0];
  }

  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Fallback Date parser
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}
