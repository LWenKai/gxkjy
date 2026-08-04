type EncodingModule = {
  TextEncoder: new (
    label?: string,
    options?: { NONSTANDARD_allowLegacyEncoding?: boolean },
  ) => { encode(value: string): number[] | Uint8Array };
};

let cachedEncoding: EncodingModule | null | undefined;

function getEncodingModule() {
  if (cachedEncoding !== undefined) return cachedEncoding;
  try {
    cachedEncoding = require('./vendor/k329/encoding.js') as EncodingModule;
  } catch {
    cachedEncoding = null;
  }
  return cachedEncoding;
}

export function encodeGb18030(value: string): number[] {
  const encoding = getEncodingModule();
  if (!encoding) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(value));
  }

  const encoder = new encoding.TextEncoder('gb18030', {
    NONSTANDARD_allowLegacyEncoding: true,
  });
  return Array.from(encoder.encode(value));
}
