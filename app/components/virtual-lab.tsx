"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bus, CheckCircle2, CirclePlay, CreditCard, MapPin, Pause, Play, Radio, RotateCcw, Users, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Run = { id: string; college_id: string; name: string; status: "running" | "paused" | "completed"; created_at: string; created_by: string };
type SimBus = { id: string; run_id: string; college_id: string; bus_number: string; registration_number: string; route_name: string; driver_name: string; capacity: number; status: "on_route" | "idle" | "delayed" | "offline" };
type SimStudent = { id: string; run_id: string; college_id: string; student_code: string; full_name: string; class_section: string; rfid_uid: string; attendance_status: "not_boarded" | "boarded" | "exited"; last_event_at: string | null };
type SimLocation = { id: string; run_id: string; college_id: string; bus_id: string; latitude: number; longitude: number; speed_kph: number; heading: number; recorded_at: string };
type SimEvent = { id: string; event_type: string; source: string; message: string; occurred_at: string; metadata: Record<string, unknown> };

const DEMO_BUSES = [
  { bus_number: "SIM-101", registration_number: "SIM-TN-01-0101", route_name: "North Campus Loop", driver_name: "Demo Driver A", capacity: 40, status: "on_route" as const, latitude: 13.0827, longitude: 80.2707, speed_kph: 28, heading: 45 },
  { bus_number: "SIM-202", registration_number: "SIM-TN-01-0202", route_name: "East Gate Express", driver_name: "Demo Driver B", capacity: 32, status: "on_route" as const, latitude: 13.0604, longitude: 80.2496, speed_kph: 36, heading: 120 },
  { bus_number: "SIM-303", registration_number: "SIM-TN-01-0303", route_name: "South Hostel Route", driver_name: "Demo Driver C", capacity: 45, status: "idle" as const, latitude: 13.1067, longitude: 80.2206, speed_kph: 0, heading: 270 },
];

const DEMO_STUDENTS = [
  { student_code: "SIM-STU-001", full_name: "Aarav Demo", class_section: "AI & DS / A", rfid_uid: "SIM-RFID-A001" },
  { student_code: "SIM-STU-002", full_name: "Diya Demo", class_section: "CSE / A", rfid_uid: "SIM-RFID-A002" },
  { student_code: "SIM-STU-003", full_name: "Kavin Demo", class_section: "ECE / B", rfid_uid: "SIM-RFID-A003" },
  { student_code: "SIM-STU-004", full_name: "Mira Demo", class_section: "AI & DS / B", rfid_uid: "SIM-RFID-A004" },
  { student_code: "SIM-STU-005", full_name: "Nila Demo", class_section: "IT / A", rfid_uid: "SIM-RFID-A005" },
  { student_code: "SIM-STU-006", full_name: "Rohan Demo", class_section: "CSE / B", rfid_uid: "SIM-RFID-A006" },
];

export default function VirtualLab() {
  const [userId, setUserId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [buses, setBuses] = useState<SimBus[]>([]);
  const [students, setStudents] = useState<SimStudent[]>([]);
  const [locations, setLocations] = useState<SimLocation[]>([]);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshRun = useCallback(async (runId: string) => {
    if (!supabase) return;
    const [runRes, busRes, studentRes, locationRes, eventRes] = await Promise.all([
      supabase.from("simulation_runs").select("*").eq("id", runId).single(),
      supabase.from("simulation_buses").select("*").eq("run_id", runId).order("bus_number"),
      supabase.from("simulation_students").select("*").eq("run_id", runId).order("student_code"),
      supabase.from("simulation_locations").select("*").eq("run_id", runId).order("recorded_at", { ascending: false }),
      supabase.from("simulation_events").select("*").eq("run_id", runId).order("occurred_at", { ascending: false }).limit(15),
    ]);
    const failed = [runRes, busRes, studentRes, locationRes, eventRes].find((r) => r.error)?.error;
    if (failed) throw failed;
    setRun(runRes.data as Run);
    setBuses((busRes.data ?? []) as SimBus[]);
    setStudents((studentRes.data ?? []) as SimStudent[]);
    setLocations((locationRes.data ?? []) as SimLocation[]);
    setEvents((eventRes.data ?? []) as SimEvent[]);
    setSelectedBus((current) => current || (busRes.data?.[0]?.id ?? ""));
    setSelectedStudent((current) => current || (studentRes.data?.[0]?.id ?? ""));
  }, []);

  const initialize = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Sign in with an authorized college account before starting the Virtual Lab.");
    setUserId(user.id);
    const { data: membership, error: memberError } = await supabase
      .from("college_members").select("college_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (memberError) throw memberError;
    if (!membership?.college_id) throw new Error("Your account has no college membership. Ask a college administrator to grant access.");
    setCollegeId(membership.college_id);
    const { data: latest, error: runError } = await supabase.from("simulation_runs")
      .select("*").eq("college_id", membership.college_id).eq("created_by", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (runError) throw runError;
    if (latest) await refreshRun(latest.id);
  }, [refreshRun]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initialize();
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not initialize the Virtual Lab.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [initialize]);

  const perform = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); }
    catch (e) { setError(e instanceof Error ? e.message : "The simulation action failed."); }
    finally { setBusy(false); }
  };

  const createRun = async () => {
    if (!supabase || !userId || !collegeId) throw new Error("A signed-in college session is required.");
    const { data: created, error: createError } = await supabase.from("simulation_runs")
      .insert({ college_id: collegeId, created_by: userId, name: "Virtual Fleet Lab", status: "running" })
      .select("*").single();
    if (createError) throw createError;
    const runId = created.id as string;
    const { data: newBuses, error: busError } = await supabase.from("simulation_buses").insert(
      DEMO_BUSES.map(({ latitude, longitude, speed_kph, heading, ...bus }) => ({ ...bus, run_id: runId, college_id: collegeId }))
    ).select("*");
    if (busError) throw busError;
    const { data: newStudents, error: studentError } = await supabase.from("simulation_students").insert(
      DEMO_STUDENTS.map((student) => ({ ...student, run_id: runId, college_id: collegeId }))
    ).select("*");
    if (studentError) throw studentError;
    const gpsRows = (newBuses as SimBus[]).map((bus) => {
      const seed = DEMO_BUSES.find((b) => b.bus_number === bus.bus_number)!;
      return { run_id: runId, college_id: collegeId, bus_id: bus.id, latitude: seed.latitude, longitude: seed.longitude, speed_kph: seed.speed_kph, heading: seed.heading };
    });
    const { error: gpsError } = await supabase.from("simulation_locations").upsert(gpsRows, { onConflict: "run_id,bus_id" });
    if (gpsError) throw gpsError;
    const { error: eventError } = await supabase.from("simulation_events").insert({
      run_id: runId, college_id: collegeId, event_type: "simulation_started", source: "virtual_lab",
      message: "Virtual fleet created with 3 synthetic buses and 6 demo students. No hardware or parent messages are contacted.",
      metadata: { buses: 3, students: 6, isolation: "simulation_tables" },
    });
    if (eventError) throw eventError;
    await refreshRun(runId);
  };

  const advanceGps = async () => {
    if (!supabase || !run || !collegeId || run.status !== "running") throw new Error("Start or resume a simulation before advancing GPS.");
    const nextRows = buses.map((bus) => {
      const previous = locations.find((loc) => loc.bus_id === bus.id);
      const latitude = previous?.latitude ?? 13.0827;
      const longitude = previous?.longitude ?? 80.2707;
      const heading = ((previous?.heading ?? 45) + 22) % 360;
      const step = bus.status === "idle" ? 0 : 0.0012;
      return {
        run_id: run.id, college_id: collegeId, bus_id: bus.id,
        latitude: Number((latitude + Math.cos((heading * Math.PI) / 180) * step).toFixed(6)),
        longitude: Number((longitude + Math.sin((heading * Math.PI) / 180) * step).toFixed(6)),
        speed_kph: bus.status === "idle" ? 0 : Math.round(22 + Math.random() * 24),
        heading, recorded_at: new Date().toISOString(),
      };
    });
    const { error: locationError } = await supabase.from("simulation_locations").upsert(nextRows, { onConflict: "run_id,bus_id" });
    if (locationError) throw locationError;
    const { error: eventError } = await supabase.from("simulation_events").insert({
      run_id: run.id, college_id: collegeId, event_type: "gps_update", source: "virtual_gps",
      message: "GPS simulator advanced " + nextRows.length + " bus positions.",
      metadata: { bus_count: nextRows.length, simulated: true },
    });
    if (eventError) throw eventError;
    await refreshRun(run.id);
  };

  const toggleRun = async () => {
    if (!supabase || !run) throw new Error("Create a simulation first.");
    const nextStatus = run.status === "running" ? "paused" : "running";
    const { error: updateError } = await supabase.from("simulation_runs").update({ status: nextStatus }).eq("id", run.id);
    if (updateError) throw updateError;
    await refreshRun(run.id);
  };

  const tapRfid = async () => {
    if (!supabase || !run || !collegeId || run.status !== "running") throw new Error("Resume the simulation before tapping an RFID card.");
    const student = students.find((s) => s.id === selectedStudent);
    const bus = buses.find((b) => b.id === selectedBus);
    if (!student || !bus) throw new Error("Select both a demo student and a simulated bus.");
    const nextStatus = student.attendance_status === "boarded" ? "exited" : "boarded";
    const eventType = nextStatus === "boarded" ? "rfid_boarding" : "rfid_exit";
    const { error: studentError } = await supabase.from("simulation_students").update({
      attendance_status: nextStatus, last_event_at: new Date().toISOString(),
    }).eq("id", student.id).eq("run_id", run.id);
    if (studentError) throw studentError;
    const { error: eventError } = await supabase.from("simulation_events").insert({
      run_id: run.id, college_id: collegeId, bus_id: bus.id, student_id: student.id,
      event_type: eventType, source: "virtual_rfid",
      message: student.full_name + (nextStatus === "boarded" ? " boarded " : " exited ") + bus.bus_number + " using demo RFID " + student.rfid_uid + ".",
      metadata: { rfid_uid: student.rfid_uid, simulated: true, parent_message_sent: false },
    });
    if (eventError) throw eventError;
    const { error: alertError } = await supabase.from("simulation_events").insert({
      run_id: run.id, college_id: collegeId, bus_id: bus.id, student_id: student.id,
      event_type: "alert", source: "virtual_notification",
      message: "SIMULATION ONLY: parent notification preview for " + student.full_name + " " + (nextStatus === "boarded" ? "boarding." : "exit.") + " No real message was sent.",
      metadata: { delivery_status: "simulated", no_external_delivery: true },
    });
    if (alertError) throw alertError;
    await refreshRun(run.id);
  };

  const createAlert = async () => {
    if (!supabase || !run || !collegeId) throw new Error("Create a simulation first.");
    const bus = buses.find((b) => b.id === selectedBus);
    const { error: eventError } = await supabase.from("simulation_events").insert({
      run_id: run.id, college_id: collegeId, bus_id: bus?.id ?? null,
      event_type: "alert", source: "virtual_notification",
      message: "SIMULATION ONLY: " + (bus ? bus.bus_number + " missed a route checkpoint." : "A demo transport alert was generated.") + " No external notification was sent.",
      metadata: { severity: "warning", delivery_status: "simulated", no_external_delivery: true },
    });
    if (eventError) throw eventError;
    await refreshRun(run.id);
  };

  const boarded = useMemo(() => students.filter((s) => s.attendance_status === "boarded").length, [students]);
  const gpsTime = (busId: string) => {
    const location = locations.find((l) => l.bus_id === busId);
    return location ? new Date(location.recorded_at).toLocaleTimeString() : "No fix";
  };

  return (
    <section className="virtual-lab">
      <div className="panel lab-hero">
        <div className="lab-hero-copy">
          <div className="lab-kicker"><span className="live-dot"/> ISOLATED SIMULATION ENVIRONMENT</div>
          <h2>Virtual Hardware Lab</h2>
          <p>Exercise GPS tracking, RFID boarding, synthetic students, fleet status and parent-alert previews against dedicated Supabase simulation tables. Production fleet records stay untouched.</p>
          <div className="lab-actions">
            <button className="date-btn lab-primary" disabled={busy || loading} onClick={() => void perform(createRun, "A fresh isolated simulation run is ready.")}><CirclePlay size={16}/> {run ? "Create fresh demo run" : "Initialize virtual fleet"}</button>
            {run && <button className="date-btn" disabled={busy} onClick={() => void perform(toggleRun, run.status === "running" ? "Simulation paused." : "Simulation resumed.")}>{run.status === "running" ? <><Pause size={15}/> Pause run</> : <><Play size={15}/> Resume run</>}</button>}
            {run && <button className="date-btn" disabled={busy || run.status !== "running"} onClick={() => void perform(advanceGps, "Virtual GPS positions advanced.")}><MapPin size={15}/> Advance GPS</button>}
          </div>
        </div>
        <div className="lab-hero-art"><div className="lab-radar"><span/><span/><span/><div className="lab-radar-center"><Bus size={24}/></div></div><div className="lab-art-caption"><Wifi size={14}/> VIRTUAL DEVICE NETWORK</div></div>
      </div>

      {(error || message) && <div className={"lab-message " + (error ? "lab-error" : "lab-success")} role={error ? "alert" : "status"}>{error ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}<span>{error || message}</span><button onClick={() => { setError(""); setMessage(""); }} aria-label="Dismiss message">×</button></div>}

      {loading ? <div className="panel lab-empty">Checking your authorized college session…</div> : !userId ? <div className="panel lab-empty"><ShieldMessage/>Sign in with an authorized college account to open the isolated Virtual Lab.</div> : !run ? <div className="panel lab-empty"><Radio size={24}/><b>No simulation run yet</b><span>Initialize the virtual fleet to create three demo buses, six synthetic students, and their first GPS fixes.</span></div> : <>
        <div className="lab-stat-grid">
          <div className="lab-stat"><span><Bus size={16}/> VIRTUAL BUSES</span><strong>{buses.length}</strong><small>Simulation-only fleet</small></div>
          <div className="lab-stat"><span><Users size={16}/> DEMO STUDENTS</span><strong>{students.length}</strong><small>{boarded} currently boarded</small></div>
          <div className="lab-stat"><span><MapPin size={16}/> GPS FIXES</span><strong>{locations.length}</strong><small>Latest point per simulated bus</small></div>
          <div className="lab-stat"><span><Activity size={16}/> EVENT TRACE</span><strong>{events.length}</strong><small>Most recent 15 events</small></div>
        </div>
        <div className="lab-columns">
          <div className="panel lab-panel">
            <div className="panel-head"><div><div className="panel-title"><Bus size={17}/> Simulated fleet</div><p>Fake buses, routes and drivers. No hardware required.</p></div><span className={"lab-status " + run.status}>{run.status}</span></div>
            <div className="lab-bus-list">{buses.map((bus) => {
              const loc = locations.find((l) => l.bus_id === bus.id);
              return <div className="lab-bus" key={bus.id}><div className="lab-bus-icon"><Bus size={18}/></div><div className="lab-bus-copy"><b>{bus.bus_number} <span>{bus.status.replace("_"," ")}</span></b><small>{bus.route_name} · {bus.driver_name}</small><small>{loc ? loc.latitude.toFixed(5) + ", " + loc.longitude.toFixed(5) + " · " + loc.speed_kph + " km/h" : "Waiting for GPS fix"}</small></div><time>{gpsTime(bus.id)}</time></div>;
            })}</div>
          </div>
          <div className="panel lab-panel">
            <div className="panel-head"><div><div className="panel-title"><CreditCard size={17}/> Virtual RFID reader</div><p>Tap toggles boarding and exit for a synthetic student.</p></div></div>
            <label className="lab-label">Demo student</label>
            <select className="lab-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>{students.map((s) => <option key={s.id} value={s.id}>{s.student_code} · {s.full_name}</option>)}</select>
            <label className="lab-label">Boarding bus</label>
            <select className="lab-select" value={selectedBus} onChange={(e) => setSelectedBus(e.target.value)}>{buses.map((b) => <option key={b.id} value={b.id}>{b.bus_number} · {b.route_name}</option>)}</select>
            {students.find((s) => s.id === selectedStudent) && <div className="lab-rfid-card"><div className="lab-rfid-chip"><CreditCard size={21}/></div><div><b>{students.find((s) => s.id === selectedStudent)?.full_name}</b><small>{students.find((s) => s.id === selectedStudent)?.rfid_uid}</small></div><span>{students.find((s) => s.id === selectedStudent)?.attendance_status.replace("_"," ")}</span></div>}
            <button className="date-btn lab-full" disabled={busy || run.status !== "running" || !students.length || !buses.length} onClick={() => void perform(tapRfid, "RFID event and simulation-only parent alert recorded.")}><Radio size={16}/> Simulate RFID tap</button>
            <button className="date-btn lab-full" disabled={busy} onClick={() => void perform(createAlert, "A simulation-only alert preview was recorded.")}><AlertTriangle size={16}/> Generate alert preview</button>
            <p className="lab-footnote">All IDs are synthetic. Alert previews are stored in simulation_events only; no SMS, WhatsApp, email or real parent notification is sent.</p>
          </div>
        </div>
        <div className="panel lab-panel lab-events">
          <div className="panel-head"><div><div className="panel-title"><Activity size={17}/> Simulation event trace</div><p>Auditable timeline of virtual GPS, RFID and alert actions.</p></div><span className="count-badge">{events.length}</span></div>
          {events.length ? <div className="lab-event-list">{events.map((event) => <div className="lab-event" key={event.id}><div className={"lab-event-icon " + event.event_type}><Activity size={15}/></div><div><b>{event.message}</b><small>{event.event_type.replace("_"," ")} · {event.source}</small></div><time>{new Date(event.occurred_at).toLocaleTimeString()}</time></div>)}</div> : <div className="empty">No simulation events yet.</div>}
        </div>
      </>}
    </section>
  );
}

function ShieldMessage() {
  return <span className="lab-lock" aria-hidden="true">🔐</span>;
}
