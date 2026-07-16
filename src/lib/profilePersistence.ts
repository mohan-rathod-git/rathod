import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ProfilePatch = Record<string, unknown>;

export async function ensureProfileRow(user: User, patch: ProfilePatch = {}) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const basePayload = {
    email: user.email ?? null,
    full_name: typeof patch.full_name === "string" ? patch.full_name : user.user_metadata?.full_name ?? "",
    ...patch,
  };

  if (existing?.id) {
    const { error } = await supabase.from("profiles").update(basePayload).eq("user_id", user.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    ...basePayload,
  });

  if (error) throw error;
}