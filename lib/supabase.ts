import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// This is a browser-only client. The publishable key is safe to expose only
// when every exposed table is protected by correctly configured RLS policies.
export const supabase =
  supabaseUrl && supabaseKey ? createBrowserClient(supabaseUrl, supabaseKey) : null;

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

/** Return the local calendar date as YYYY-MM-DD without locale-dependent parsing. */
export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Reads operational data using the current browser user's Supabase session.
 * Every query relies on database RLS for college-level authorization.
 * Errors are surfaced to the UI instead of silently presenting fake data.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!supabase) return emptySnapshot(false);

  // Do not treat a cached session object as proof of identity. Supabase's
  // authenticated requests and RLS policies enforce access at the database.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return emptySnapshot(true, false);

  const today = localDateKey();
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
        .is("ended_at", null).order("started_at", { ascending: false }).limit(200),
      supabase.from("attendance").select("id", { count: "exact", head: true })
        .eq("attendance_date", today),
      supabase.from("alerts")
        .select("id,alert_type,message,delivery_status,created_at")
        .order("created_at", { ascending: false }).limit(10),
    ]);

  const firstError = [busRes, routeRes, driverRes, locationRes, tripRes, attendanceRes, alertRes]
    .find((result) => result.error)?.error;
  if (firstError) throw firstError;

  // Queries are newest-first, so the first row for each bus is its latest GPS fix.
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
