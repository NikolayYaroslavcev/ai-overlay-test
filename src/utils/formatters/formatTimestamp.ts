// ISO datetime -> short local clock time (e.g. "10:24 AM"), for message timestamps.
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}
