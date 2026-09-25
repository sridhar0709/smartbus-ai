import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Browser-safe client. Never place a Supabase service-role key in NEXT_PUBLIC_*.
export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type BusRecord = {
  id: string;
  bus_number: string;
  registration_number: string | null;
  capacity: number | null;
  status: string;
  route_id: string | null;
  driver_id: string | null;
};

export type RouteRecord = { id: string; name: string; direction: string; active: boolean };
export type DriverRecord = { id: string; name: string; active: boolean };
export type LocationRecord = {
  bus_id: string;
  trip_id: string | null;
  latitude: number;
  longitude: number;
  speed_kph: number | null;
  heading: number | null;
  recorded_at: string;
};
export type TripRecord = {
  id: string;
  bus_id: string;
  route_id: string | null;
  driver_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
};
export type DashboardSnapshot = {
  configured: boolean;
  authenticated: boolean;
  buses: BusRecord[];
  routes: RouteRecord[];
  drivers: DriverRecord[];
  locations: LocationRecord[];
  trips: TripRecord[];
  attendanceToday: number;
  alerts: { id: string; alert_type: string; message: string; delivery_status: string; created_at: string }[];
};

const emptySnapshot = (configured: boolean, authenticated = false): DashboardSnapshot => ({
  configured, authenticated, buses: [], routes: [], drivers: [], locations: [], trips: [],
  attendanceToday: 0, alerts: [],
});

/**
 * Reads operational data using the current user's Supabase session.
 * Existing RLS policies scope rows to the user's college membership.
 * No anonymous fallback or privileged key is used.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!supabase) return emptySnapshot(false);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return emptySnapshot(true, false);

  const today = new Date().toLocaleDateString("en-CA");
  const [busRes, routeRes, driverRes, locationRes, tripRes, attendanceRes, alertRes] =
    await Promise.all([
      supabase.from("buses")
        .select("id,bus_number,registration_number,capacity,status,route_id,driver_id")
        .order("bus_number"),
      supabase.from("routes").select("id,name,direction,active").eq("active", true).order("name"),
      supabase.from("drivers").select("id,name,active").eq("active", true).order("name"),
      supabase.from("bus_locations")
        .select("bus_id,trip_id,latitude,longitude,speed_kph,heading,recorded_at")
        .order("recorded_at", { ascending: false }).limit(500),
      supabase.from("trips")
        .select("id,bus_id,route_id,driver_id,started_at,ended_at,status")
        .is("ended_at", null).order("started_at", { ascending: false }),
      supabase.from("attendance").select("id", { count: "exact", head: true })
        .eq("attendance_date", today),
      supabase.from("alerts")
        .select("id,alert_type,message,delivery_status,created_at")
        .order("created_at", { ascending: false }).limit(10),
    ]);

  const firstError = [busRes, routeRes, driverRes, locationRes, tripRes, attendanceRes, alertRes]
    .find((result) => result.error)?.error;
  if (firstError) throw firstError;

  // Keep only the newest GPS point for each bus.
  const newestByBus = new Map<string, LocationRecord>();
  for (const row of (locationRes.data ?? []) as LocationRecord[]) {
    if (!newestByBus.has(row.bus_id)) newestByBus.set(row.bus_id, row);
  }

  return {
    configured: true,
    authenticated: true,
    buses: (busRes.data ?? []) as BusRecord[],
    routes: (routeRes.data ?? []) as RouteRecord[],
    drivers: (driverRes.data ?? []) as DriverRecord[],
    locations: [...newestByBus.values()],
    trips: (tripRes.data ?? []) as TripRecord[],
    attendanceToday: attendanceRes.count ?? 0,
    alerts: (alertRes.data ?? []) as DashboardSnapshot["alerts"],
  };
}
