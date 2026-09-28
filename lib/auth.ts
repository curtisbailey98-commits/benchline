export function getFounderEmails(): string[] {
  const raw = process.env.FOUNDER_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getFounderEmails().includes(email.trim().toLowerCase());
}
