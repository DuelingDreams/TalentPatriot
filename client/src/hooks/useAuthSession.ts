import { supabase } from "@/lib/supabase";

export async function waitForSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  return new Promise((resolve) => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        sub.subscription.unsubscribe();
        resolve(session);
      }
    });
  });
}