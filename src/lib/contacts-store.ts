import { supabase } from "@/integrations/supabase/client";

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relation: string | null;
  priority: boolean;
}

export async function listContacts(userId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EmergencyContact[];
}

export async function createContact(
  userId: string,
  input: { name: string; phone: string; relation?: string; priority?: boolean },
) {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({
      user_id: userId,
      name: input.name,
      phone: input.phone,
      relation: input.relation ?? null,
      priority: input.priority ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EmergencyContact;
}

export async function updateContact(id: string, patch: Partial<Omit<EmergencyContact, "id" | "user_id">>) {
  const { error } = await supabase.from("emergency_contacts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
  if (error) throw error;
}
