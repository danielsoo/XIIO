/** Routes that should not open client Firestore listeners (upload uses server API + Storage). */
export function isUploaderAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/uploader" || pathname.startsWith("/uploader/");
}
