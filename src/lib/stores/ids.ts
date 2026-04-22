export function newId(): string {
  return crypto.randomUUID();
}

export function nowMs(): number {
  return Date.now();
}
