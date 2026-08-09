/** Formats a number using Indian digit grouping (e.g. 1234567 -> "12,34,567"), no Intl dependency. */
export function formatInr(value: number): string {
  const rounded = Math.round(value);
  const isNegative = rounded < 0;
  const digits = Math.abs(rounded).toString();

  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;

  return `${isNegative ? '-' : ''}₹${grouped}`;
}
