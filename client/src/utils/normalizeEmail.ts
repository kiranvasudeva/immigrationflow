const EMAIL_RE = /^[^\s"<>@]+@[^\s"<>@]+\.[^\s"<>@]+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().replace(/^"+|"+$/g, "").toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const e = normalizeEmail(raw);
  return EMAIL_RE.test(e);
}
