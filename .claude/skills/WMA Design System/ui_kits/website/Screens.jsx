const { useState: useState2 } = React;

// ─── HomeScreen ─────────────────────────────────────
window.HomeScreen = function HomeScreen({ navigate }) {
  const tools = [
    { id: "harmony", title: "Harmony Trainer", desc: "Practice singing vocal harmonies with real-time pitch feedback", icon: <HarmonyIcon />, accent: "#003049" },
    { id: "setlist", title: "Setlist Manager", desc: "Import chord charts, build setlists, and export for worship nights", icon: <SetlistIcon />, accent: "#003049" },
    { id: "merch", title: "Merch Store", desc: "Patches, stickers, and custom embroidered gear", icon: <MerchIcon />, accent: "#003049" },
    { id: "join", title: "Join the Team", desc: "Apply for a leadership role or team position in PSU Worship", icon: <JoinIcon />, accent: "#b45741" },
  ];
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "#fff7eb" }}>
      <header style={{ padding: "40px 24px 20px", textAlign: "center" }}>
        <div style={{ marginBottom: 10 }}><Wordmark size={36} /></div>
        <p style={{ margin: 0, fontSize: 15, color: "rgba(0,48,73,0.60)", fontWeight: 300 }}>Tools for worship teams</p>
      </header>
      <main style={{ flex: 1, padding: "16px 24px 40px", maxWidth: 640, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {tools.map((t) => <ToolCard key={t.id} {...t} onClick={() => navigate(t.id)} />)}
        </div>
        <div style={{ marginTop: 20, padding: 18, border: "2px dashed rgba(0,48,73,0.2)", borderRadius: 16, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(0,48,73,0.40)" }}>More tools coming soon…</p>
        </div>
      </main>
      <footer style={{ padding: 16, textAlign: "center", fontSize: 12, color: "rgba(0,48,73,0.40)" }}>Penn State Worship</footer>
    </div>
  );
};

// ─── JoinScreen ─────────────────────────────────────
const LEADERSHIP_ROLES = [
  { title: "Vice President", description: "Assist the President and coordinate across all teams." },
  { title: "Music Director", description: "Lead musical direction for worship nights and recordings." },
  { title: "Event Coordinator", description: "Plan and execute worship nights and events." },
  { title: "Hospitality Lead", description: "Create a welcoming environment at every event." },
  { title: "Social Media Lead", description: "Shape the creative voice of our social channels." },
  { title: "Graphic Design Lead", description: "Design merch and maintain brand consistency." },
];
const TEAM_ROLES = [
  { title: "Media & Social Team", description: "Capture events on camera and manage posts." },
  { title: "Events & Hospitality Team", description: "Help set up events and greet guests." },
  { title: "Graphics Team", description: "Assist with design assets and flyers." },
  { title: "Sound & Tech Team", description: "Run sound and gear at events." },
];

function RoleCard({ title, description, variant, selectionNumber, isDimmed, onToggle }) {
  const [hover, setHover] = useState2(false);
  const isSelected = selectionNumber !== null;
  const isLeadership = variant === "leadership";
  const bg = isLeadership
    ? (isSelected ? "#b45741" : "#003049")
    : (isSelected ? "rgba(180,87,65,0.10)" : "#fff7eb");
  const borderColor = isLeadership
    ? (isSelected ? "#b45741" : "transparent")
    : (isSelected ? "#b45741" : (hover ? "rgba(0,48,73,0.40)" : "rgba(0,48,73,0.20)"));
  const titleColor = isLeadership ? "#fff7eb" : (isSelected ? "#b45741" : "#003049");
  const descColor = isLeadership ? "rgba(255,247,235,0.7)" : "rgba(0,48,73,0.6)";
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onToggle}
      style={{
        borderRadius: 16, padding: 18, minHeight: 104, position: "relative", cursor: "pointer",
        background: bg, border: `1px solid ${borderColor}`,
        opacity: isDimmed ? 0.3 : 1, pointerEvents: isDimmed ? "none" : "auto",
        transform: hover && !isSelected ? "translateY(-2px)" : "none",
        boxShadow: hover && !isSelected ? "0 8px 24px rgba(0,48,73,0.10)" : "none",
        transition: "all 200ms",
      }}
    >
      {isSelected && (
        <div style={{ position: "absolute", top: 8, right: 14, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 44, lineHeight: 1, color: isLeadership ? "rgba(196,145,58,0.9)" : "rgba(180,87,65,0.7)" }}>{selectionNumber}</div>
      )}
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600, fontSize: 18, lineHeight: 1.15, color: titleColor, marginBottom: 6 }}>{title}</div>
      {(hover || isSelected) && (
        <div style={{ fontSize: 11.5, lineHeight: 1.5, fontWeight: 300, color: descColor }}>{description}</div>
      )}
    </div>
  );
}

window.JoinScreen = function JoinScreen({ navigate }) {
  const [selected, setSelected] = useState2([]);
  const [worshipTeam, setWorshipTeam] = useState2(false);
  const MAX = 3;

  const toggleRole = (title) => {
    setSelected((prev) => {
      if (prev.includes(title)) return prev.filter((r) => r !== title);
      if (prev.length >= MAX) return prev;
      return [...prev, title];
    });
  };
  const atMax = selected.length >= MAX;

  return (
    <div style={{ minHeight: "100%", background: "#fff7eb", color: "#003049" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 24px 80px" }}>
        <div style={{ marginBottom: 18 }}>
          <button onClick={() => navigate("home")} style={{ background: "none", border: 0, color: "rgba(0,48,73,0.6)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>← Back</button>
        </div>
        <div style={{ paddingTop: 20 }}>
          <Eyebrow>PSU Worship</Eyebrow>
          <h1 style={{ margin: "0 0 12px 0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600, fontSize: 60, lineHeight: 1.05, color: "#003049" }}>Join the Team.</h1>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 300, color: "rgba(0,48,73,0.55)", lineHeight: 1.6, maxWidth: 440 }}>God is working at Penn State and music is playing a huge role. We're looking for people who want to be part of that.</p>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 40, marginBottom: 48, position: "relative", width: "100%", height: 40, borderRadius: 9999, overflow: "hidden", background: "rgba(0,48,73,0.1)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "25%", background: "#003049" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "25%", width: "45%", pointerEvents: "none", background: "linear-gradient(90deg, rgba(127,160,175,0.32) 0%, rgba(127,160,175,0.10) 40%, transparent 100%)", borderRadius: "0 9999px 9999px 0" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
            {["Roles", "About You", "Your Story", "Follow Up"].map((l, i) => (
              <div key={l} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: i < 1 ? "#fff7eb" : "rgba(0,48,73,0.3)" }}>{l}</div>
            ))}
          </div>
        </div>

        {/* Counter */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600, fontSize: 18, letterSpacing: "0.02em", color: selected.length > 0 ? "#b45741" : "rgba(0,48,73,0.40)" }}>{selected.length} / 3 selected</p>

        {/* Team Positions */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600, fontSize: 24, color: "#003049" }}>Team Positions</h2>
            <div style={{ flex: 1, height: 1, background: "rgba(0,48,73,0.1)" }} />
            <span style={{ fontSize: 11, color: "rgba(0,48,73,0.4)" }}>Lower time commitment</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {TEAM_ROLES.map((r) => {
              const n = selected.indexOf(r.title);
              return <RoleCard key={r.title} title={r.title} description={r.description} variant="team" selectionNumber={n >= 0 ? n + 1 : null} isDimmed={atMax && !selected.includes(r.title)} onToggle={() => toggleRole(r.title)} />;
            })}
          </div>
        </section>

        {/* Leadership Roles */}
        <section style={{ marginTop: 36 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600, fontSize: 24, color: "#003049" }}>Leadership Roles</h2>
            <div style={{ flex: 1, height: 1, background: "rgba(0,48,73,0.1)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {LEADERSHIP_ROLES.map((r) => {
              const n = selected.indexOf(r.title);
              return <RoleCard key={r.title} title={r.title} description={r.description} variant="leadership" selectionNumber={n >= 0 ? n + 1 : null} isDimmed={atMax && !selected.includes(r.title)} onToggle={() => toggleRole(r.title)} />;
            })}
          </div>
        </section>

        {/* Worship Team block */}
        <section style={{ marginTop: 36, borderRadius: 20, padding: 24, background: "rgba(180,87,65,0.07)", border: "1px solid rgba(180,87,65,0.2)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600, fontSize: 20, color: "#003049" }}>Interested in Live Worship or Recording Songs?</h3>
          <label onClick={() => setWorshipTeam((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, border: "1px solid rgba(180,87,65,0.4)", background: worshipTeam ? "#b45741" : "#fff7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {worshipTeam && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff7eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Yes, I'd like to be part of the Worship Team</span>
          </label>
        </section>

        <div style={{ marginTop: 36 }}>
          <PillButton disabled={selected.length === 0}>Continue</PillButton>
        </div>
      </div>
    </div>
  );
};

// ─── SetlistScreen ──────────────────────────────────
window.SetlistScreen = function SetlistScreen({ navigate }) {
  const setlists = [
    { id: 1, name: "Fall Worship Night", date: "Oct 18, 2026", time: "7:00 PM", songs: 6 },
    { id: 2, name: "Weekly Rehearsal", date: "Oct 12, 2026", time: "", songs: 4 },
    { id: 3, name: "Recording Session", date: "Oct 4, 2026", time: "", songs: 3 },
  ];
  const songs = [
    { id: 1, title: "Goodness of God", artist: "Bethel Music", key: "G" },
    { id: 2, title: "How He Loves", artist: "David Crowder", key: "E" },
    { id: 3, title: "Gratitude", artist: "Brandon Lake", key: "D" },
    { id: 4, title: "Same God", artist: "Elevation Worship", key: "A" },
    { id: 5, title: "Raise a Hallelujah", artist: "Bethel Music", key: "D" },
  ];
  return (
    <div style={{ minHeight: "100%", background: "#fff7eb", color: "#003049" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 24px 40px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("home")}><Wordmark size={24} /></span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "rgba(0,48,73,0.6)", display: "flex", alignItems: "center", gap: 4 }}>⟳ Sync</span>
            <span style={{ fontSize: 13, color: "rgba(0,48,73,0.6)" }}>Harmony Trainer</span>
          </div>
        </header>
        <h1 style={{ margin: "0 0 32px 0", fontSize: 28, fontWeight: 700 }}>Setlist Manager</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
          <button style={{ background: "#003049", color: "#b45741", padding: "16px", borderRadius: 10, fontWeight: 600, fontSize: 14, border: 0, cursor: "pointer", fontFamily: "inherit" }}>+ Import Song</button>
          <button style={{ background: "#003049", color: "#b45741", padding: "16px", borderRadius: 10, fontWeight: 600, fontSize: 14, border: 0, cursor: "pointer", fontFamily: "inherit" }}>+ New Setlist</button>
        </div>
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Recent Setlists</h2>
            <span style={{ fontSize: 13, color: "rgba(0,48,73,0.6)", cursor: "pointer" }}>View all</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {setlists.map((s) => (
              <div key={s.id} style={{ background: "rgba(0,48,73,0.05)", borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(0,48,73,0.6)", marginTop: 2 }}>{s.date}{s.time && ` · ${s.time}`}</div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(0,48,73,0.6)" }}>{s.songs} songs</div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Song Library</h2>
            <span style={{ fontSize: 13, color: "rgba(0,48,73,0.6)", cursor: "pointer" }}>View all (27)</span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {songs.map((s) => (
              <div key={s.id} style={{ background: "rgba(0,48,73,0.05)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{s.title}</span>
                  <span style={{ fontSize: 13, color: "rgba(0,48,73,0.6)", marginLeft: 8 }}>{s.artist}</span>
                </div>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, background: "rgba(0,48,73,0.10)", padding: "2px 8px", borderRadius: 6 }}>{s.key}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// ─── MerchScreen ────────────────────────────────────
window.MerchScreen = function MerchScreen({ navigate }) {
  const products = [
    { id: 1, name: "Cross Ring", price: 1800, sizes: ["6", "7", "8"], img: "../../assets/imagery/cross-ring-clean.jpg" },
    { id: 2, name: "Wrap Cross", price: 2400, sizes: ["7", "8", "9"], img: "../../assets/imagery/cross-ring.jpg" },
    { id: 3, name: "Fall '26 Tee", price: 2500, limited: true, sizes: ["S", "M", "L"], img: "../../assets/imagery/event-photo.jpg" },
  ];
  return (
    <div style={{ background: "#1a1714", color: "#f5ead6", minHeight: "100%" }}>
      {/* Sticky header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid #3a3228", background: "rgba(26,23,20,0.8)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 1150, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#f5ead6" }}><Wordmark size={20} merch="dark" /></div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span onClick={() => navigate("home")} style={{ fontSize: 12, color: "#968a78", cursor: "pointer" }}>← Back to Tools</span>
            <span style={{ fontSize: 18, cursor: "pointer" }}>🛒</span>
          </div>
        </div>
      </header>
      {/* Hero */}
      <div style={{ position: "relative", height: 360, overflow: "hidden", background: "#1a1714" }}>
        <img src="../../assets/imagery/fabric-texture.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom" }} alt="" />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <img src="../../assets/logos/psuworship-patchwork.png" alt="PSUWorship" style={{ width: "min(80%, 520px)", filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.7))" }} />
          <div style={{ marginTop: -32, background: "#f5ead6", color: "#1a1714", padding: "8px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.6)", transform: "rotate(-2deg)", fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.4em", fontSize: 14, position: "relative" }}>
            <span style={{ position: "absolute", inset: 3, border: "1px dashed rgba(196,121,58,0.4)", pointerEvents: "none" }} />
            MERCH
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -40, height: 80, background: "linear-gradient(to bottom, transparent, #1a1714)" }} />
      </div>
      {/* Grid */}
      <section style={{ maxWidth: 1150, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32 }}>
          {products.map((p) => (
            <a key={p.id} style={{ display: "block", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div style={{ position: "relative", borderRadius: 20, border: "1px solid #3a3228", background: "#242019", overflow: "hidden", aspectRatio: "1", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <img src={p.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                {p.limited && (
                  <div style={{ position: "absolute", top: 10, right: 10, background: "#c4793a", color: "#1a1714", padding: "4px 10px", borderRadius: 9999, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Limited</div>
                )}
                <div style={{ position: "absolute", inset: "auto 0 0 0", padding: "10px 14px", borderTop: "1px solid rgba(58,50,40,0.5)", background: "rgba(26,23,20,0.7)", backdropFilter: "blur(10px)" }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{p.name}</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>${(p.price / 100).toFixed(2)}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.sizes.map((s) => (<span key={s} style={{ padding: "2px 6px", borderRadius: 4, fontFamily: "ui-monospace, monospace", fontSize: 9, background: "rgba(245,234,214,0.1)", color: "#968a78" }}>{s}</span>))}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
