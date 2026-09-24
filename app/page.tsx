"use client";

import { useState } from "react";
import { Activity, Bus, Bell, ChevronDown, CircleHelp, Clock3, MapPin, Menu, Navigation, Search, ShieldCheck, Users, Zap, ArrowUpRight, Radio, Route, Settings, SlidersHorizontal, UserRound, X } from "lucide-react";

const buses = [
  { id: "TN 30 AB 4821", route: "Route 01 · Salem North", driver: "K. Murugan", students: 42, status: "On route", color: "lime", time: "2 min ago", pos: [27, 40] },
  { id: "TN 30 AC 1190", route: "Route 02 · Omalur", driver: "S. Prakash", students: 38, status: "On route", color: "blue", time: "Just now", pos: [58, 28] },
  { id: "TN 30 AD 7712", route: "Route 03 · Hasthampatti", driver: "R. Kumar", students: 31, status: "Delayed", color: "amber", time: "4 min ago", pos: [68, 65] },
  { id: "TN 30 AE 2204", route: "Route 04 · Attur", driver: "M. Selvam", students: 36, status: "At campus", color: "purple", time: "Just now", pos: [43, 72] },
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [{ label: "Overview", icon: Activity }, { label: "Live fleet", icon: Bus }, { label: "Attendance", icon: Users }, { label: "Routes", icon: Route }, { label: "Alerts", icon: Bell }];
  const filtered = buses.filter(b => (b.id + b.route + b.driver).toLowerCase().includes(search.toLowerCase()));
  return (
    <main className="shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Bus size={22}/></div><div><b>smartbus<span>.ai</span></b><small>FLEET INTELLIGENCE</small></div><button className="mobile-close" onClick={()=>setMenuOpen(false)}><X size={18}/></button></div>
        <div className="workspace"><div className="college-avatar">VC</div><div className="workspace-copy"><b>Vivekanadha College</b><small>Transport department</small></div><ChevronDown size={15}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{nav.map(({label,icon:Icon})=><button key={label} onClick={()=>{setActive(label);setMenuOpen(false)}} className={active===label?"nav-item active":"nav-item"}><Icon size={18}/><span>{label}</span>{label==="Alerts"&&<i className="nav-count">3</i>}</button>)}</nav>
        <div className="nav-label second">MANAGE</div>
        <button className="nav-item" onClick={()=>setActive("Settings")}><Settings size={18}/><span>Settings</span></button>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Need a hand?</b><p>Check the fleet operations guide.</p><button onClick={()=>alert("Operations guide will be available when the help center is connected.")}>Open help center <ArrowUpRight size={14}/></button></div><div className="profile"><div className="profile-avatar">SR</div><div className="profile-copy"><b>Sridhar R</b><small>Fleet administrator</small></div><Settings size={17}/></div></div>
      </aside>
      {menuOpen&&<button className="scrim" onClick={()=>setMenuOpen(false)} aria-label="Close menu"/>}
      <section className="main-area">
        <header className="topbar"><div className="crumb"><button className="hamburger" onClick={()=>setMenuOpen(true)}><Menu size={20}/></button><span>Workspace</span><span className="crumb-slash">/</span><b>{active}</b></div><div className="top-actions"><div className="live-pill"><span/> SYSTEM LIVE</div><button className="icon-btn" aria-label="Notifications" onClick={()=>setActive("Alerts")}><Bell size={18}/><i/></button><div className="top-divider"/><div className="top-user">SR</div></div></header>
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> THURSDAY, SEPTEMBER 24, 2026</div><h1>Good evening, Sridhar <span>✦</span></h1><p>Here’s what’s happening across your fleet today.</p></div><button className="date-btn"><Clock3 size={16}/> Today <ChevronDown size={15}/></button></div>
          <div className="stats-grid">
            <Stat icon={<Bus size={18}/>} label="TOTAL FLEET" value="24" detail={<><span className="up">↗ 2</span> vs last month</>} tone="violet" />
            <Stat icon={<Navigation size={18}/>} label="BUSES ON ROUTE" value="18" detail={<><span className="live-dot"/> 75% of fleet active</>} tone="green"/>
            <Stat icon={<Users size={18}/>} label="STUDENTS ONBOARD" value="684" detail={<><span className="up">↗ 8.4%</span> from yesterday</>} tone="blue"/>
            <Stat icon={<ShieldCheck size={18}/>} label="ATTENDANCE RATE" value="96.8%" detail={<><span className="up">↗ 1.2%</span> this week</>} tone="orange"/>
          </div>
          <div className="dashboard-grid">
            <section className="panel map-panel"><div className="panel-head"><div><div className="panel-title">Live fleet map <span className="live-tag"><i/> LIVE</span></div><p>Real-time vehicle positions across Salem</p></div><button className="panel-icon" title="Map options"><SlidersHorizontal size={17}/></button></div>
              <div className="map-canvas"><div className="map-grid"/><svg className="map-lines" viewBox="0 0 700 390" preserveAspectRatio="none"><path d="M-20 320 C120 280 150 150 260 190 S440 300 720 80" className="road major"/><path d="M70 -10 C180 100 130 230 320 410" className="road"/><path d="M300 -10 C270 100 480 140 410 400" className="road"/><path d="M-10 100 C200 160 450 10 720 210" className="road"/><path d="M-20 320 C120 280 150 150 260 190 S440 300 720 80" className="route-line"/></svg><div className="map-label label-one">SALEM NORTH</div><div className="map-label label-two">HASTHAMPATTI</div><div className="map-label label-three">OMALUR ROAD</div><div className="campus-pin"><span><Bus size={16}/></span><b>VCT CAMPUS</b></div>{buses.map((bus,i)=><button key={bus.id} className={`bus-marker marker-${bus.color} ${selected===i?"marker-selected":""}`} style={{left:bus.pos[0]+"%",top:bus.pos[1]+"%"}} onClick={()=>setSelected(i)} title={bus.id}><Bus size={17}/></button>)}<div className="map-zoom"><button onClick={()=>alert("Map zoom controls activate with live map integration.")}>+</button><button onClick={()=>alert("Map zoom controls activate with live map integration.")}>−</button></div><div className="map-attribution">Map preview · Connect MapLibre for live tiles</div></div>
              <div className="map-footer"><div className="map-legend"><span><i className="legend-green"/> On route</span><span><i className="legend-amber"/> Delayed</span><span><i className="legend-purple"/> At campus</span></div><button className="text-action" onClick={()=>setActive("Live fleet")}>View all vehicles <ArrowUpRight size={15}/></button></div>
            </section>
            <section className="panel fleet-panel"><div className="panel-head"><div><div className="panel-title">Fleet status <span className="count-badge">24</span></div><p>Monitor your active vehicles</p></div><button className="more-btn" onClick={()=>setActive("Live fleet")}>View all <ArrowUpRight size={14}/></button></div><div className="fleet-search"><Search size={16}/><input placeholder="Search bus or route..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><div className="fleet-list">{filtered.map((bus)=>{const idx=buses.indexOf(bus);return <button key={bus.id} className={`fleet-row ${selected===idx?"fleet-selected":""}`} onClick={()=>setSelected(idx)}><div className={`fleet-bus-icon ${bus.color}`}><Bus size={18}/></div><div className="fleet-info"><b>{bus.id}</b><span>{bus.route}</span><small><UserRound size={12}/>{bus.driver} · {bus.students} students</small></div><div className="fleet-status"><i className={bus.color}/><span>{bus.status}</span><small>{bus.time}</small></div></button>})}{filtered.length===0&&<div className="empty">No vehicles match your search.</div>}</div><div className="fleet-bottom"><span><i/> GPS signal healthy</span><span>Updated just now</span></div></section>
          </div>
          <div className="bottom-grid"><section className="panel activity-panel"><div className="panel-head"><div><div className="panel-title">Recent activity</div><p>Latest updates from your fleet</p></div><button className="more-btn" onClick={()=>setActive("Alerts")}>See all <ArrowUpRight size={14}/></button></div><div className="activity-list"><ActivityRow icon={<MapPin size={16}/>} tone="green" title="Bus TN 30 AC 1190 reached checkpoint" desc="Omalur Main Road · Route 02" time="2 min ago"/><ActivityRow icon={<Users size={16}/>} tone="blue" title="Attendance synced successfully" desc="Route 01 · 42 students marked present" time="8 min ago"/><ActivityRow icon={<Bell size={16}/>} tone="amber" title="Route 03 running 8 minutes late" desc="Traffic congestion · Hasthampatti" time="14 min ago"/></div></section><section className="panel system-panel"><div className="panel-head"><div><div className="panel-title">System health</div><p>Live platform diagnostics</p></div><span className="healthy-badge"><i/> All systems normal</span></div><div className="health-list"><Health label="GPS connectivity" value="98.4%" width="98%" color="green"/><Health label="Attendance sync" value="99.9%" width="99.9%" color="blue"/><Health label="Notification delivery" value="97.2%" width="97%" color="purple"/></div><div className="system-foot"><Radio size={15}/> Last system check <b>Just now</b></div></section></div>
          <footer className="footer"><span>© 2026 SmartBus AI · Built for safer journeys.</span><span><i/> All systems operational</span></footer>
        </div>
      </section>
    </main>
  );
}

function Stat({icon,label,value,detail,tone}:{icon:React.ReactNode,label:string,value:string,detail:React.ReactNode,tone:string}){return <div className="stat-card"><div className="stat-top"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-menu">···</span></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>}
function ActivityRow({icon,tone,title,desc,time}:{icon:React.ReactNode,tone:string,title:string,desc:string,time:string}){return <div className="activity-row"><div className={`activity-icon ${tone}`}>{icon}</div><div className="activity-copy"><b>{title}</b><span>{desc}</span></div><time>{time}</time></div>}
function Health({label,value,width,color}:{label:string,value:string,width:string,color:string}){return <div className="health-row"><div className="health-meta"><span>{label}</span><b>{value}</b></div><div className="progress"><span className={color} style={{width}}/></div></div>}
