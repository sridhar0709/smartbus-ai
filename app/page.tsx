"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bus, Bell, ChevronDown, CircleHelp, Clock3, MapPin, Menu, Navigation, Search, ShieldCheck, Users, ArrowUpRight, Radio, Route, Settings, SlidersHorizontal, UserRound, X } from "lucide-react";
import { getDashboardSnapshot, supabase, type DashboardSnapshot } from "@/lib/supabase";

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mapOptionsOpen, setMapOptionsOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dashboardDate, setDashboardDate] = useState(() => new Date().toLocaleDateString("en-CA"));

  const load = async () => {
    try {
      const data = await getDashboardSnapshot();
      setSnapshot(data);
      setDataError("");
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not load Supabase data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const data = await getDashboardSnapshot();
        if (alive) { setSnapshot(data); setDataError(""); }
      } catch (error) {
        if (alive) setDataError(error instanceof Error ? error.message : "Could not load Supabase data.");
      } finally { if (alive) setLoading(false); }
    };
    void refresh();
    const { data } = supabase?.auth.onAuthStateChange(() => { if (alive) void refresh(); }) ?? { data: { subscription: { unsubscribe() {} } } };
    const timer = window.setInterval(() => { if (alive) void refresh(); }, 30000);
    return () => { alive = false; window.clearInterval(timer); data.subscription.unsubscribe(); };
  }, []);

  const routeById = useMemo(() => new Map((snapshot?.routes ?? []).map((r) => [r.id, r.name])), [snapshot]);
  const driverById = useMemo(() => new Map((snapshot?.drivers ?? []).map((d) => [d.id, d.name])), [snapshot]);
  const buses = useMemo(() => {
    const locations = snapshot?.locations ?? [];
    const latitudes = locations.map((p) => p.latitude);
    const longitudes = locations.map((p) => p.longitude);
    const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes), maxLng = Math.max(...longitudes);
    return (snapshot?.buses ?? []).map((b, i) => {
      const gps = locations.find((p) => p.bus_id === b.id);
      const trip = snapshot?.trips.find((t) => t.bus_id === b.id);
      const latSpan = maxLat - minLat || 1, lngSpan = maxLng - minLng || 1;
      const pos: [number, number] | null = gps ? [12 + ((gps.longitude - minLng) / lngSpan) * 76, 12 + (1 - (gps.latitude - minLat) / latSpan) * 76] : null;
      return {
        id: b.bus_number || b.registration_number || b.id,
        route: routeById.get(b.route_id ?? "") || "Route not assigned",
        driver: driverById.get(b.driver_id ?? "") || "Driver not assigned",
        status: trip ? "On route" : (b.status || "Inactive"),
        color: trip ? "lime" : "purple",
        time: gps ? new Date(gps.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "No GPS",
        pos, hasGps: !!gps,
      };
    });
  }, [snapshot, routeById, driverById]);
  const filtered = buses.filter((b) => (b.id + b.route + b.driver).toLowerCase().includes(search.toLowerCase()));
  const onRoute = snapshot?.trips.length ?? 0;
  const attendanceLabel = snapshot && snapshot.attendanceToday > 0 ? String(snapshot.attendanceToday) : "—";

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !email.trim()) return;
    setAuthBusy(true); setAuthMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setAuthMessage(error ? error.message : "Secure sign-in link sent. Check your email.");
    setAuthBusy(false);
  };

  const nav = [{ label: "Overview", icon: Activity }, { label: "Live fleet", icon: Bus }, { label: "Attendance", icon: Users }, { label: "Routes", icon: Route }, { label: "Alerts", icon: Bell }];
  return (
    <main className="shell">
      <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}>
        <div className="brand"><div className="brand-mark"><Bus size={22}/></div><div><b>smartbus<span>.ai</span></b><small>FLEET INTELLIGENCE</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={18}/></button></div>
        <div className="workspace"><div className="college-avatar">SB</div><div className="workspace-copy"><b>College workspace</b><small>Transport department</small></div><ChevronDown size={15}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{nav.map(({label,icon:Icon})=><button key={label} onClick={()=>{setActive(label);setMenuOpen(false)}} className={active===label?"nav-item active":"nav-item"}><Icon size={18}/><span>{label}</span>{label==="Alerts"&&!!snapshot?.alerts.length&&<i className="nav-count">{snapshot.alerts.length}</i>}</button>)}</nav>
        <div className="nav-label second">MANAGE</div>
        <button className="nav-item" onClick={()=>setActive("Settings")}><Settings size={18}/><span>Settings</span></button>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Need a hand?</b><p>Check the fleet operations guide.</p><button onClick={()=>setHelpOpen((open)=>!open)} aria-expanded={helpOpen}> {helpOpen ? "Close operations guide" : "Open help center"} <ArrowUpRight size={14}/></button></div><div className="profile"><div className="profile-avatar">SB</div><div className="profile-copy"><b>Staff session</b><small>{snapshot?.authenticated ? "Authenticated" : "Not signed in"}</small></div><Settings size={17}/></div></div>
      </aside>
      {menuOpen&&<button className="scrim" onClick={()=>setMenuOpen(false)} aria-label="Close menu"/>}
      <section className="main-area">
        <header className="topbar"><div className="crumb"><button className="hamburger" onClick={()=>setMenuOpen(true)}><Menu size={20}/></button><span>Workspace</span><span className="crumb-slash">/</span><b>{active}</b></div><div className="top-actions"><div className="live-pill"><span/> {snapshot?.authenticated ? "SUPABASE CONNECTED" : "SIGN-IN REQUIRED"}</div><button className="icon-btn" aria-label="Notifications" onClick={()=>setActive("Alerts")}><Bell size={18}/><i/></button><div className="top-divider"/><div className="top-user">SB</div></div></header>
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> {new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase()}</div><h1>Fleet overview <span>✦</span></h1><p>{loading ? "Loading your authorized college data…" : "Operational data from your Supabase workspace."}</p></div><button className="date-btn" onClick={()=>setDatePickerOpen((open)=>!open)} aria-expanded={datePickerOpen}><Clock3 size={16}/> {dashboardDate===new Date().toLocaleDateString("en-CA")?"Today":dashboardDate} <ChevronDown size={15}/></button></div>
          {datePickerOpen && <section className="panel" style={{padding:16,marginBottom:20}}><label htmlFor="dashboard-date" style={{display:"block",marginBottom:8,fontWeight:600}}>Dashboard date</label><input id="dashboard-date" type="date" value={dashboardDate} max={new Date().toLocaleDateString("en-CA")} onChange={(e)=>setDashboardDate(e.target.value)} style={{padding:10,borderRadius:8}}/><p style={{marginTop:8,fontSize:13}}>The fleet, GPS, trip and alert panels show the latest authorized records. Attendance count currently represents today only.</p></section>}
          {helpOpen && <section className="panel" style={{padding:20,marginBottom:20}}><div className="panel-title">SmartBus AI operations guide</div><p>Use Overview for fleet totals and recent alerts. Open Live fleet to search buses and select a vehicle. Routes lists active routes visible to your account. Attendance shows the authorized count for today. If data is missing, confirm you are signed in with your college staff account and that your Supabase Row Level Security policies permit access.</p><button className="date-btn" onClick={()=>setHelpOpen(false)}>Close guide</button></section>}
          {!snapshot?.authenticated && <section className="panel" style={{padding:20,marginBottom:20}}><div className="panel-title">{snapshot?.configured === false ? "Supabase is not configured" : "Staff sign-in required"}</div><p style={{margin:"8px 0 14px"}}>{snapshot?.configured === false ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel project environment variables." : "Enter your authorized college staff email. Supabase authentication and existing row-level security determine which college data you can access."}</p>{snapshot?.configured !== false && <form onSubmit={sendMagicLink} style={{display:"flex",gap:8,flexWrap:"wrap"}}><input aria-label="Staff email" type="email" required placeholder="staff@college.edu" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:12,borderRadius:10,minWidth:220}}/><button className="date-btn" disabled={authBusy}>{authBusy?"Sending…":"Send secure sign-in link"}</button></form>}{authMessage&&<p role="status">{authMessage}</p>}</section>}
          {dataError&&<section className="panel" role="alert" style={{padding:16,marginBottom:20}}><b>Supabase request failed</b><p>{dataError}</p><button className="date-btn" onClick={()=>{setLoading(true);void load();}}>Retry</button></section>}
          {active === "Overview" ? <>
          <div className="stats-grid">
            <Stat icon={<Bus size={18}/>} label="TOTAL FLEET" value={loading?"…":String(snapshot?.buses.length??0)} detail={<>Registered buses</>} tone="violet"/>
            <Stat icon={<Navigation size={18}/>} label="BUSES ON ROUTE" value={loading?"…":String(onRoute)} detail={<>Active trip records</>} tone="green"/>
            <Stat icon={<Users size={18}/>} label="ATTENDANCE TODAY" value={loading?"…":attendanceLabel} detail={<>{snapshot?.attendanceToday??0} records returned</>} tone="blue"/>
            <Stat icon={<ShieldCheck size={18}/>} label="GPS REPORTING" value={loading?"…":String(snapshot?.locations.length??0)} detail={<>Buses with recent GPS points</>} tone="orange"/>
          </div>
          <div className="dashboard-grid">
            <section className="panel map-panel"><div className="panel-head"><div><div className="panel-title">Live fleet map <span className="live-tag"><i/> SUPABASE</span></div><p>Plots latest authorized GPS points. Coordinates are normalized for this preview map.</p></div><button className="panel-icon" title="Map options" aria-expanded={mapOptionsOpen} onClick={()=>setMapOptionsOpen((open)=>!open)}><SlidersHorizontal size={17}/></button></div>
              <div className="map-canvas" style={{zoom:mapZoom}}><div className="map-grid"/><svg className="map-lines" viewBox="0 0 700 390" preserveAspectRatio="none"><path d="M-20 320 C120 280 150 150 260 190 S440 300 720 80" className="road major"/><path d="M70 -10 C180 100 130 230 320 410" className="road"/><path d="M300 -10 C270 100 480 140 410 400" className="road"/><path d="M-10 100 C200 160 450 10 720 210" className="road"/></svg><div className="campus-pin"><span><Bus size={16}/></span><b>FLEET</b></div>{buses.filter(b=>b.hasGps&&b.pos).map((bus)=>{const idx=buses.findIndex(b=>b.id===bus.id);return <button key={bus.id} className={"bus-marker marker-"+bus.color+(selected===bus.id?" marker-selected":"")} style={{left:bus.pos![0]+"%",top:bus.pos![1]+"%"}} onClick={()=>setSelected(bus.id)} title={bus.id}><Bus size={17}/></button>;})}{!loading&&buses.every(b=>!b.hasGps)&&<div className="map-label" style={{left:"30%",top:"48%"}}>No GPS points in Supabase</div>}<div className="map-zoom"><button aria-label="Zoom in" onClick={()=>setMapZoom((z)=>Math.min(1.5,Number((z+0.1).toFixed(1))))} disabled={mapZoom>=1.5}>+</button><button aria-label="Zoom out" onClick={()=>setMapZoom((z)=>Math.max(0.7,Number((z-0.1).toFixed(1))))} disabled={mapZoom<=0.7}>−</button></div><div className="map-attribution">Stylized preview · live coordinates from Supabase</div></div>
              {mapOptionsOpen && <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,fontSize:13}}><span>Preview zoom: {Math.round(mapZoom*100)}%</span><button className="text-action" onClick={()=>{setMapZoom(1);setSelected("");}}>Reset map view</button></div>}<div className="map-footer"><div className="map-legend"><span><i className="legend-green"/> Active trip</span><span><i className="legend-purple"/> Other bus</span></div><button className="text-action" onClick={()=>setActive("Live fleet")}>View all vehicles <ArrowUpRight size={15}/></button></div>
            </section>
            <section className="panel fleet-panel"><div className="panel-head"><div><div className="panel-title">Fleet status <span className="count-badge">{snapshot?.buses.length??0}</span></div><p>Vehicles returned by your college's RLS policies</p></div><button className="more-btn" onClick={()=>setActive("Live fleet")}>View all <ArrowUpRight size={14}/></button></div><div className="fleet-search"><Search size={16}/><input placeholder="Search bus or route..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><div className="fleet-list">{filtered.map(bus=><button key={bus.id} className={"fleet-row "+(selected===bus.id?"fleet-selected":"")} onClick={()=>setSelected(bus.id)}><div className={"fleet-bus-icon "+bus.color}><Bus size={18}/></div><div className="fleet-info"><b>{bus.id}</b><span>{bus.route}</span><small><UserRound size={12}/>{bus.driver}</small></div><div className="fleet-status"><i className={bus.color}/><span>{bus.status}</span><small>{bus.time}</small></div></button>)}{!loading&&filtered.length===0&&<div className="empty">{search?"No vehicles match your search.":"No buses returned. Add authorized operational records in Supabase."}</div>}</div><div className="fleet-bottom"><span><i/> {snapshot?.locations.length??0} buses with GPS records</span><span>{loading?"Loading…":"Auto-refresh 30s"}</span></div></section>
          </div>
          <div className="bottom-grid"><section className="panel activity-panel"><div className="panel-head"><div><div className="panel-title">Recent alerts</div><p>Latest alert records visible to your account</p></div><button className="more-btn" onClick={()=>setActive("Alerts")}>See all <ArrowUpRight size={14}/></button></div><div className="activity-list">{(snapshot?.alerts??[]).map(a=><ActivityRow key={a.id} icon={<Bell size={16}/>} tone="amber" title={a.message||a.alert_type} desc={a.alert_type+" · "+a.delivery_status} time={new Date(a.created_at).toLocaleString()}/>)}{!loading&&!(snapshot?.alerts.length)&&<div className="empty">No alerts returned by Supabase.</div>}</div></section><section className="panel system-panel"><div className="panel-head"><div><div className="panel-title">Data status</div><p>Counts from authenticated queries</p></div><span className="healthy-badge"><i/> {snapshot?.authenticated?"Session active":"Sign-in needed"}</span></div><div className="health-list"><Health label="GPS points loaded" value={String(snapshot?.locations.length??0)} width={Math.min(100,(snapshot?.locations.length??0)*10)+"%"} color="green"/><Health label="Active trips" value={String(onRoute)} width={Math.min(100,onRoute*10)+"%"} color="blue"/><Health label="Recent alerts" value={String(snapshot?.alerts.length??0)} width={Math.min(100,(snapshot?.alerts.length??0)*10)+"%"} color="purple"/></div><div className="system-foot"><Radio size={15}/> Data refresh <b>Every 30 seconds</b></div></section></div>

          </> : active === "Live fleet" ? <section className="panel" style={{padding:20}}><div className="panel-head"><div><div className="panel-title">Live fleet</div><p>Live bus records visible to your signed-in college account.</p></div><button className="more-btn" onClick={()=>{setLoading(true);void load();}}>Refresh <Radio size={14}/></button></div><div className="fleet-search"><Search size={16}/><input placeholder="Search bus, route or driver..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="fleet-list">{filtered.map(bus=><button key={bus.id} className={"fleet-row "+(selected===bus.id?"fleet-selected":"")} onClick={()=>setSelected(bus.id)}><div className={"fleet-bus-icon "+bus.color}><Bus size={18}/></div><div className="fleet-info"><b>{bus.id}</b><span>{bus.route}</span><small><UserRound size={12}/>{bus.driver}</small></div><div className="fleet-status"><i className={bus.color}/><span>{bus.status}</span><small>{bus.time}</small></div></button>)}{!loading&&filtered.length===0&&<div className="empty">No bus records found for this account.</div>}</div></section>
          : active === "Attendance" ? <section className="panel" style={{padding:20}}><div className="panel-title">Attendance today</div><p>Attendance records returned by the authenticated Supabase query.</p><div className="stats-grid"><Stat icon={<Users size={18}/>} label="TODAY'S RECORDS" value={loading?"…":String(snapshot?.attendanceToday??0)} detail={<>Attendance rows for today</>} tone="blue"/></div><div className="empty">Detailed student attendance rows are not included in the current dashboard snapshot. The count above is live; a detailed attendance table requires a scoped attendance query.</div></section>
          : active === "Routes" ? <section className="panel" style={{padding:20}}><div className="panel-head"><div><div className="panel-title">Routes</div><p>Routes available under your college's existing row-level security.</p></div><span className="count-badge">{snapshot?.routes.length??0}</span></div><div className="activity-list">{(snapshot?.routes??[]).map(r=><div className="activity-row" key={r.id}><div className="activity-icon"><Route size={16}/></div><div className="activity-copy"><b>{r.name}</b><span>{r.active ? "Active" : "Inactive"}</span></div></div>)}{!loading&&!(snapshot?.routes.length)&&<div className="empty">No route records returned for this account.</div>}</div></section>
          : active === "Alerts" ? <section className="panel" style={{padding:20}}><div className="panel-head"><div><div className="panel-title">Alerts</div><p>Recent alerts returned by Supabase.</p></div><button className="more-btn" onClick={()=>{setLoading(true);void load();}}>Refresh <Radio size={14}/></button></div><div className="activity-list">{(snapshot?.alerts??[]).map(a=><ActivityRow key={a.id} icon={<Bell size={16}/>} tone="amber" title={a.message||a.alert_type} desc={a.alert_type+" · "+a.delivery_status} time={new Date(a.created_at).toLocaleString()}/>)}{!loading&&!(snapshot?.alerts.length)&&<div className="empty">No alerts returned for this account.</div>}</div></section>
          : <section className="panel" style={{padding:20}}><div className="panel-title">Settings</div><p>Session and connection settings for this dashboard.</p><div className="activity-list"><div className="activity-row"><div className="activity-icon"><ShieldCheck size={16}/></div><div className="activity-copy"><b>Authentication</b><span>{snapshot?.authenticated?"Signed in with Supabase":"No authenticated staff session"}</span></div></div><div className="activity-row"><div className="activity-icon"><Radio size={16}/></div><div className="activity-copy"><b>Data refresh</b><span>Automatic refresh every 30 seconds</span></div></div>{snapshot?.authenticated&&<button className="date-btn" onClick={async()=>{await supabase?.auth.signOut();setActive("Overview");setAuthMessage("Signed out.");}}>Sign out</button>}</div></section>}
          <footer className="footer"><span>© 2026 SmartBus AI · Built for safer journeys.</span><span><i/> {snapshot?.authenticated?"Supabase session active":"Authentication required"}</span></footer>
        </div>
      </section>
    </main>
  );
}

function Stat({icon,label,value,detail,tone}:{icon:React.ReactNode,label:string,value:string,detail:React.ReactNode,tone:string}){return <div className="stat-card"><div className="stat-top"><div className={"stat-icon "+tone}>{icon}</div><span className="stat-menu">···</span></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>}
function ActivityRow({icon,tone,title,desc,time}:{icon:React.ReactNode,tone:string,title:string,desc:string,time:string}){return <div className="activity-row"><div className={"activity-icon "+tone}>{icon}</div><div className="activity-copy"><b>{title}</b><span>{desc}</span></div><time>{time}</time></div>}
function Health({label,value,width,color}:{label:string,value:string,width:string,color:string}){return <div className="health-row"><div className="health-meta"><span>{label}</span><b>{value}</b></div><div className="progress"><span className={color} style={{width}}/></div></div>}
