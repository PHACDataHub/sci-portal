export function getFirstDateOfYear(date: Date): string {
  const year = date.getFullYear();
  const firstDate = new Date(year, 0, 1);
  return firstDate.toISOString();
}
