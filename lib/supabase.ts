import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type BusRecord = {
  id: string;
  registration_number: string;
  capacity: number;
  status: string;
  route_id: string | null;
  driver_id: string | null;
};

export async function getFleetSnapshot() {
  if (!supabase) return { configured: false as const, buses: [] as BusRecord[] };
  const { data, error } = await supabase
    .from("buses")
    .select("id, registration_number, capacity, status, route_id, driver_id")
    .order("registration_number");
  if (error) throw error;
  return { configured: true as const, buses: (data ?? []) as BusRecord[] };
}
