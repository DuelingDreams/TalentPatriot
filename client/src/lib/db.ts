export function isPermissionError(e: any) {
  const msg = e?.message || "";
  return e?.code === "PGRST301" || msg.includes("permission denied") || msg.includes("JWT") || e?.status === 401 || e?.status === 403;
}