export function emptyToUndefined({ value }: { value: unknown }) {
  return value === '' || value === null ? undefined : value;
}

export function emptyToBoolean({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value === true || value === 'true';
}
