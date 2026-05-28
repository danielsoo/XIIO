export function collabInvitePath(token: string): string {
  return `/collab-invite/${token}`;
}

export function buildCollabInviteUrl(token: string, appUrl?: string): string {
  const path = collabInvitePath(token);
  const base = appUrl?.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export function maskInviteEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••";
  const visible = local.length <= 2 ? local[0] ?? "*" : `${local.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}
