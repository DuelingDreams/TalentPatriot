import { useEffect, useState } from "react";
import { waitForSession } from "./hooks/useAuthSession";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { void waitForSession().finally(() => setReady(true)); }, []);
  if (!ready) return <div className="p-6">Loading…</div>;
  return <>{children}</>;
}