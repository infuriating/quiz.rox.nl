// Join codes avoid characters that are easy to confuse on a beamer: 0/O and 1/I.
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;

export function randomJoinCode(): string {
  const bytes = new Uint8Array(JOIN_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => JOIN_CODE_ALPHABET[b % JOIN_CODE_ALPHABET.length]).join("");
}

export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
