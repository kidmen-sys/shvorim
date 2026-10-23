import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

const BRANDS = {
  "רמי לוי":    { border: "#e8001a", balUrl: "https://ramilevydigital.mltp.co.il/?fireglass_rsn=true" },
  "סופר קרפור": { border: "#003da5", balUrl: "https://tavplus.mltp.co.il/" },
  "שופרסל":     { border: "#00873c" },
  "ויקטורי":    { border: "#f97316" },
  "מגה ספורט":  { border: "#2d7a2d" },
  "מחסני להב":  { border: "#7c1c1c" },
  "BOOM":       { border: "#ca8a04" },
  "חבר":        { border: "#1e40af" },
  "מקדונלד'ס":  { border: "#da0004" },
  "פיצה שמש":   { border: "#d97706" },
  "פיצה סטורי": { border: "#dc2626" },
  "פיצה האט":   { border: "#cc0000" },
  "דומינו'ס":   { border: "#006491" },
  "יינות ביתן": { border: "#7e22ce" },
  "אחר":        { border: "#6b7280" },
};
const CHAIN_LIST = Object.keys(BRANDS);

const brand     = (c) => BRANDS[c] || BRANDS["אחר"];
const isSoon    = (e) => { if (!e) return false; const d = (new Date(e) - new Date()) / 86400000; return d >= 0 && d <= 14; };
const isExpired = (e) => e && new Date(e) < new Date();
const daysLeft  = (e) => { if (!e) return null; return Math.ceil((new Date(e) - new Date()) / 86400000); };

// ─── לוגו ─────────────────────────────────────────────────────────────────────
function Logo({ chain }) {
  const box = { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" };
  const logos = {
    "רמי לוי":    <div style={{ ...box, background: "#fff" }}><img src="https://upload.wikimedia.org/wikipedia/he/thumb/4/4e/Rami_Levy_Logo.svg/200px-Rami_Levy_Logo.svg.png" style={{ width: 36, objectFit: "contain" }} alt="" /></div>,
    "סופר קרפור": <div style={{ ...box, background: "#003da5" }}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/200px-Carrefour_logo.svg.png" style={{ width: 34, objectFit: "contain" }} alt="" /></div>,
    "שופרסל":     <div style={{ ...box, background: "#fff" }}><img src="https://upload.wikimedia.org/wikipedia/he/thumb/a/a4/Shufersal_logo.svg/200px-Shufersal_logo.svg.png" style={{ width: 36, objectFit: "contain" }} alt="" /></div>,
    "ויקטורי":    <div style={{ ...box, background: "#fff" }}><img src="https://upload.wikimedia.org/wikipedia/he/thumb/8/87/Victory_Israel_logo.svg/200px-Victory_Israel_logo.svg.png" style={{ width: 36, objectFit: "contain" }} alt="" /></div>,
    "מגה ספורט":  <div style={{ ...box, background: "#fff" }}><img src="https://upload.wikimedia.org/wikipedia/he/b/b0/Mega_sport_logo.png" style={{ width: 36, objectFit: "contain" }} alt="" /></div>,
    "מחסני להב":  <div style={{ ...box, background: "#7c1c1c" }}><span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>להב</span></div>,
    "BOOM":       <div style={{ ...box, background: "#ca8a04" }}><span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>BOOM</span></div>,
    "חבר":        <div style={{ ...box, background: "#1e40af" }}><span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>חבר</span></div>,
    "מקדונלד'ס":  <div style={{ ...box, background: "#da0004" }}><span style={{ fontSize: 24 }}>🍔</span></div>,
    "פיצה שמש":   <div style={{ ...box, background: "#d97706" }}><span style={{ fontSize: 22 }}>🍕</span></div>,
    "פיצה סטורי": <div style={{ ...box, background: "#dc2626" }}><span style={{ fontSize: 22 }}>🍕</span></div>,
    "פיצה האט":   <div style={{ ...box, background: "#cc0000" }}><span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>PHT</span></div>,
    "דומינו'ס":   <div style={{ ...box, background: "#006491" }}><span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>DOM</span></div>,
    "יינות ביתן": <div style={{ ...box, background: "#7e22ce" }}><span style={{ fontSize: 22 }}>🍷</span></div>,
  };
  return logos[chain] || <div style={{ ...box, background: "#374151", color: "#9ca3af", fontSize: 18 }}>🏪</div>;
}

// ─── כרטיס שובר ───────────────────────────────────────────────────────────────
function CouponCard({ c, onArchive, onDelete, onEdit, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [imgOpen, setImgOpen] = useState(false);
  const expired = isExpired(c.expiry);
  const soon    = isSoon(c.expiry);
  const days    = daysLeft(c.expiry);
  const b       = brand(c.chain);

  const badge = expired
    ? { text: "פג תוקף", bg: "rgba(239,68,68,0.15)", color: "#f87171", border: "rgba(239,68,68,0.3)" }
    : soon
    ? { text: days === 0 ? "פג היום!" : `${days} ימים`, bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" }
    : { text: "תקין", bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.25)" };

  const balUrl = b.balUrl;

  return (
    <div style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))", border: `1.5px solid ${expired ? "rgba(239,68,68,0.4)" : soon ? "rgba(251,191,36,0.45)" : b.border + "55"}`, borderRadius: 16, padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 10, position: "relative", opacity: expired ? 0.75 : 1 }}>

      {/* שורה עליונה */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Logo chain={c.chain} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#e8f0fe" }}>{c.chain}</span>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontWeight: 600 }}>{badge.text}</span>
          </div>
          {c.discount && <div style={{ fontSize: 13, color: "#93c5fd", marginTop: 2 }}>💰 {c.discount}</div>}
          {c.code && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 13, background: "rgba(255,255,255,0.07)", padding: "2px 8px", borderRadius: 6, color: "#e2e8f0", letterSpacing: 1 }}>{c.code}</span>
              <button onClick={() => navigator.clipboard?.writeText(c.code)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0, color: "#60a5fa" }} title="העתק">📋</button>
            </div>
          )}
          {c.expiry && <div style={{ fontSize: 11, color: expired ? "#f87171" : soon ? "#fbbf24" : "rgba(255,255,255,0.4)", marginTop: 3 }}>📅 {c.expiry}</div>}
          {c.addedBy && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>👤 {c.addedBy}</div>}
          {/* הערות — גדולות וברורות */}
          {c.notes && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#e2e8f0", background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 8, padding: "5px 9px", lineHeight: 1.5 }}>
              📝 {c.notes}
            </div>
          )}
        </div>
      </div>

      {/* תמונה — כפתור קטן בלבד, לחיצה פותחת מוגדל */}
      {c.image && (
        <button onClick={() => setImgOpen(true)} style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
          📷 הצג שובר
        </button>
      )}

      {/* כפתורי פעולה */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {/* סדר עדיפות */}
        <div style={{ display: "flex", gap: 3, marginLeft: "auto" }}>
          {!isFirst && (
            <button onClick={onMoveUp} title="העלה עדיפות" style={{ background: "rgba(99,179,237,0.15)", border: "1px solid rgba(99,179,237,0.3)", borderRadius: 8, padding: "4px 8px", color: "#63b3ed", cursor: "pointer", fontSize: 14 }}>⬆️</button>
          )}
          {!isLast && (
            <button onClick={onMoveDown} title="הורד עדיפות" style={{ background: "rgba(99,179,237,0.15)", border: "1px solid rgba(99,179,237,0.3)", borderRadius: 8, padding: "4px 8px", color: "#63b3ed", cursor: "pointer", fontSize: 14 }}>⬇️</button>
          )}
        </div>
        {balUrl && (
          <a href={`${balUrl}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button style={{ background: "rgba(99,179,237,0.15)", border: "1px solid rgba(99,179,237,0.3)", borderRadius: 8, padding: "5px 10px", color: "#63b3ed", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>💳 בדוק יתרה</button>
          </a>
        )}
        <button onClick={() => onEdit(c)} style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: "5px 10px", color: "#fbbf24", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✏️ ערוך</button>
        <button onClick={() => onArchive(c.id)} style={{ background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.25)", borderRadius: 8, padding: "5px 10px", color: "#9ca3af", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>📦 ארכיון</button>
        <button onClick={() => { if (confirm("למחוק שובר זה?")) onDelete(c.id); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "5px 10px", color: "#f87171", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🗑️</button>
      </div>

      {imgOpen && (
        <div onClick={() => setImgOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={c.image} alt="" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 0 40px rgba(0,0,0,0.8)" }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── כרטיס ארכיון ──────────────────────────────────────────────────────────────
function ArchivedCard({ c, onRestore, onDelete }) {
  const b = brand(c.chain);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}>
      <Logo chain={c.chain} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#9ca3af" }}>{c.chain}</div>
        {c.discount && <div style={{ fontSize: 12, color: "#6b7280" }}>{c.discount}</div>}
        {c.code && <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6b7280" }}>{c.code}</div>}
        {c.notes && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>📝 {c.notes}</div>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onRestore(c.id)} style={{ background: "rgba(99,179,237,0.12)", border: "1px solid rgba(99,179,237,0.3)", borderRadius: 8, padding: "5px 9px", color: "#63b3ed", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>↩️ החזר</button>
        <button onClick={() => { if (confirm("למחוק?")) onDelete(c.id); }} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "5px 9px", color: "#f87171", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🗑️</button>
      </div>
    </div>
  );
}

// ─── סטטיסטיקה ─────────────────────────────────────────────────────────────────
function StatsView({ coupons, active, archived }) {
  const soon14 = active.filter(c => isSoon(c.expiry) && !isExpired(c.expiry));
  const expired = active.filter(c => isExpired(c.expiry));

  const byChain = {};
  active.forEach(c => {
    if (!byChain[c.chain]) byChain[c.chain] = { count: 0, discount: 0 };
    byChain[c.chain].count++;
    const m = (c.discount || "").match(/(\d+)/);
    if (m) byChain[c.chain].discount += parseInt(m[1]);
  });
  const chains = Object.entries(byChain).sort((a, b) => b[1].discount - a[1].discount);

  const statBox = (icon, label, val, color) => (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* אזהרות פגיעה */}
      {soon14.length > 0 && (
        <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: 14, marginBottom: 8 }}>⚠️ שוברים שפגים בקרוב (14 יום)</div>
          {soon14.map(c => {
            const d = daysLeft(c.expiry);
            return (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
                <span style={{ color: "#e2e8f0", fontSize: 13 }}>{c.chain} — {c.discount || c.code}</span>
                <span style={{ color: d <= 3 ? "#f87171" : "#fbbf24", fontWeight: 700, fontSize: 12 }}>
                  {d === 0 ? "היום!" : d < 0 ? "פג!" : `${d} ימים`}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {expired.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#f87171", fontSize: 14 }}>🚨 {expired.length} שוברים פגי תוקף — מומלץ לארכב</div>
        </div>
      )}

      {/* מספרים */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {statBox("🎟️", "שוברים פעילים", active.length, "#63b3ed")}
        {statBox("⚠️", "פגים בקרוב", soon14.length, "#fbbf24")}
        {statBox("📦", "בארכיון", archived.length, "#9ca3af")}
      </div>

      {/* לפי רשת */}
      {chains.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, color: "#e8f0fe", fontSize: 14, marginBottom: 12 }}>📊 שוברים לפי רשת</div>
          {chains.map(([chain, { count, discount }]) => (
            <div key={chain} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <Logo chain={chain} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>{chain}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{count} שוברים</div>
              </div>
              {discount > 0 && <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 14 }}>₪{discount}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ראשי ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [coupons, setCoupons]   = useState([]);
  const [tab, setTab]           = useState("active");
  const [showStats, setShowStats] = useState(false);
  const [filterChain, setFilterChain] = useState("הכל");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ chain: "", customChain: "", code: "", expiry: "", discount: "", notes: "", addedBy: "אני" });
  const [imgPreview, setImgPreview] = useState(null);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const editImgRef = useRef(null);

  // ── Firebase
  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // ── כפתור חזרה בטלפון — מניעת סגירת אפליקציה
  useEffect(() => {
    const onBack = (e) => {
      if (showForm) { e.preventDefault(); setShowForm(false); setEditId(null); setImgPreview(null); return; }
      if (showStats) { e.preventDefault(); setShowStats(false); return; }
      if (filterChain !== "הכל") { e.preventDefault(); setFilterChain("הכל"); return; }
      if (tab !== "active") { e.preventDefault(); setTab("active"); return; }
      // אין מה לסגור — נשאר
      e.preventDefault();
    };
    // push state ריק כדי שיהיה מה לחזור אליו
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [showForm, showStats, filterChain, tab]);

  const active   = coupons.filter(c => !c.used);
  const archived = coupons.filter(c => c.used);

  const displayed = (tab === "active" ? active : archived)
    .filter(c => filterChain === "הכל" || c.chain === filterChain);

  // chains for filter chips
  const chains = [...new Set((tab === "active" ? active : archived).map(c => c.chain))];

  // ── סריקת תמונה
  const scanImage = useCallback(async (file) => {
    if (!file) return;
    setScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target.result.split(",")[1];
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: b64, type: file.type }),
        });
        if (!res.ok) throw new Error("scan failed");
        const data = await res.json();
        setForm(f => ({
          ...f,
          code:     data.code    || f.code,
          expiry:   data.expiry  || f.expiry,
          discount: data.discount || f.discount,
        }));
        setImgPreview(ev.target.result);
      } catch (e) {
        console.error(e);
        setImgPreview(ev.target.result);
        alert("לא הצלחתי לזהות את פרטי השובר אוטומטית — נא למלא ידנית");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // הדבקת תמונה Ctrl+V
  useEffect(() => {
    const onPaste = (e) => {
      if (!showForm) return;
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
      if (item) scanImage(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [showForm, scanImage]);

  // ── שמירה
  const handleSave = async () => {
    const chainName = (form.chain === "אחר" && form.customChain.trim()) ? form.customChain.trim() : form.chain;
    const codeVal = form.code.trim();
    if (!chainName || !codeVal) return alert("נא למלא רשת וקוד שובר");
    if (!editId && active.some(c => c.code === codeVal)) return alert("שובר עם קוד זה כבר קיים!");
    setSaving(true);
    try {
      if (editId) {
        const updateData = { chain: chainName, code: codeVal, expiry: form.expiry, discount: form.discount, notes: form.notes, addedBy: form.addedBy };
        // עדכון תמונה רק אם שונתה
        if (imgPreview !== null) updateData.image = imgPreview;
        await updateDoc(doc(db, "coupons", editId), updateData);
      } else {
        await addDoc(collection(db, "coupons"), { chain: chainName, code: codeVal, expiry: form.expiry, discount: form.discount, notes: form.notes, addedBy: form.addedBy, used: false, image: imgPreview || null, priority: Date.now(), createdAt: serverTimestamp() });
      }
      setShowForm(false); setEditId(null); setImgPreview(null);
      setForm({ chain: "", customChain: "", code: "", expiry: "", discount: "", notes: "", addedBy: "אני" });
    } finally { setSaving(false); }
  };

  const startEdit = (c) => {
    setForm({ chain: c.chain, customChain: "", code: c.code, expiry: c.expiry || "", discount: c.discount || "", notes: c.notes || "", addedBy: c.addedBy || "אני" });
    setImgPreview(null); // null = לא שונה
    setEditId(c.id);
    setShowForm(true);
  };

  const handleArchive = (id) => updateDoc(doc(db, "coupons", id), { used: true });
  const handleRestore = (id) => updateDoc(doc(db, "coupons", id), { used: false });
  const handleDelete  = (id) => deleteDoc(doc(db, "coupons", id));

  // ── סדר עדיפות
  const handleMoveUp = async (idx, list) => {
    if (idx === 0) return;
    const a = list[idx], b = list[idx - 1];
    const pa = a.priority ?? a.createdAt?.toMillis?.() ?? 0;
    const pb = b.priority ?? b.createdAt?.toMillis?.() ?? 0;
    await updateDoc(doc(db, "coupons", a.id), { priority: pb - 1 });
  };

  const handleMoveDown = async (idx, list) => {
    if (idx === list.length - 1) return;
    const a = list[idx], b = list[idx + 1];
    const pb = b.priority ?? b.createdAt?.toMillis?.() ?? 0;
    await updateDoc(doc(db, "coupons", a.id), { priority: pb + 1 });
  };

  // sort active by priority
  const sortedActive = [...active].sort((a, b) => {
    const pa = a.priority ?? (a.createdAt?.toMillis?.() ?? 0);
    const pb = b.priority ?? (b.createdAt?.toMillis?.() ?? 0);
    return pa - pb;
  });

  const displayedActive = sortedActive.filter(c => filterChain === "הכל" || c.chain === filterChain);
  const displayedArchived = archived.filter(c => filterChain === "הכל" || c.chain === filterChain);
  const displayedList = tab === "active" ? displayedActive : displayedArchived;

  const soon14Count = active.filter(c => isSoon(c.expiry) && !isExpired(c.expiry)).length;

  // ── UI
  const inp = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", direction: "rtl", fontFamily: "inherit", boxSizing: "border-box" };
  const lbl = { fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#0d1b2a,#1a2838)", color: "#e8f0fe", fontFamily: "'Heebo','Segoe UI',Arial,sans-serif", direction: "rtl", padding: "0 0 80px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap'); * { box-sizing: border-box; } button { font-family: inherit; } input,select,textarea { font-family: inherit; } textarea { resize: vertical; }`}</style>

      {/* כותרת */}
      <div style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>🎟️ שוברים וחיסכון</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{active.length} פעילים · {archived.length} בארכיון</div>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setImgPreview(null); setForm({ chain: "", customChain: "", code: "", expiry: "", discount: "", notes: "", addedBy: "אני" }); }}
          style={{ background: "linear-gradient(135deg,#3182ce,#2563eb)", border: "none", borderRadius: 12, padding: "9px 14px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          ＋ הוסף
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 12px" }}>

        {/* לשוניות */}
        <div style={{ display: "flex", gap: 8, margin: "14px 0 12px", overflowX: "auto", paddingBottom: 2 }}>
          {[{ k: "active", label: `פעילים (${active.length})` }, { k: "archive", label: `ארכיון (${archived.length})` }].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setShowStats(false); setFilterChain("הכל"); }}
              style={{ padding: "7px 14px", borderRadius: 20, border: tab === t.k && !showStats ? "1px solid #63b3ed" : "1px solid rgba(255,255,255,0.09)", background: tab === t.k && !showStats ? "rgba(99,179,237,0.14)" : "rgba(255,255,255,0.04)", color: tab === t.k && !showStats ? "#63b3ed" : "rgba(255,255,255,0.4)", fontWeight: tab === t.k && !showStats ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", fontSize: 13 }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowStats(s => !s)}
            style={{ padding: "7px 14px", borderRadius: 20, border: showStats ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.09)", background: showStats ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.04)", color: showStats ? "#f59e0b" : "rgba(255,255,255,0.4)", fontWeight: showStats ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", fontSize: 13, position: "relative" }}>
            📊 סטטיסטיקה{soon14Count > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{soon14Count}</span>}
          </button>
        </div>

        {/* סטטיסטיקה */}
        {showStats && <StatsView coupons={coupons} active={active} archived={archived} />}

        {/* chips לפי רשת */}
        {!showStats && chains.length > 1 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
            {["הכל", ...chains].map(ch => (
              <button key={ch} onClick={() => setFilterChain(ch)}
                style={{ padding: "5px 12px", borderRadius: 16, border: filterChain === ch ? `1px solid ${brand(ch).border}` : "1px solid rgba(255,255,255,0.1)", background: filterChain === ch ? brand(ch).border + "22" : "rgba(255,255,255,0.04)", color: filterChain === ch ? "#e8f0fe" : "rgba(255,255,255,0.4)", cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: filterChain === ch ? 700 : 400 }}>
                {ch}
              </button>
            ))}
          </div>
        )}

        {/* רשימה */}
        {!showStats && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayedList.length === 0 ? (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "48px 0", fontSize: 14 }}>
                {tab === "active" ? "אין שוברים פעילים 🎉" : "הארכיון ריק"}
              </div>
            ) : tab === "active" ? (
              displayedActive.map((c, idx) => (
                <CouponCard key={c.id} c={c}
                  onArchive={handleArchive} onDelete={handleDelete} onEdit={startEdit}
                  onMoveUp={() => handleMoveUp(idx, displayedActive)}
                  onMoveDown={() => handleMoveDown(idx, displayedActive)}
                  isFirst={idx === 0} isLast={idx === displayedActive.length - 1}
                />
              ))
            ) : (
              displayedArchived.map(c => <ArchivedCard key={c.id} c={c} onRestore={handleRestore} onDelete={handleDelete} />)
            )}
          </div>
        )}
      </div>

      {/* מודל הוספה/עריכה */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditId(null); setImgPreview(null); } }}>
          <div style={{ background: "#1a2838", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{editId ? "✏️ עריכת שובר" : "➕ הוספת שובר"}</div>

            {/* העלאת תמונה */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>תמונת שובר (אופציונלי) — גם Ctrl+V עובד</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {scanning ? (
                  <button disabled style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "not-allowed" }}>⏳ מזהה פרטים...</button>
                ) : (
                  <>
                    <button onClick={() => fileRef.current?.click()} style={{ background: "rgba(99,179,237,0.12)", border: "1px solid rgba(99,179,237,0.3)", borderRadius: 10, padding: "8px 14px", color: "#63b3ed", cursor: "pointer", fontSize: 13 }}>🖼️ גלריה</button>
                    <button onClick={() => cameraRef.current?.click()} style={{ background: "rgba(99,179,237,0.12)", border: "1px solid rgba(99,179,237,0.3)", borderRadius: 10, padding: "8px 14px", color: "#63b3ed", cursor: "pointer", fontSize: 13 }}>📷 מצלמה</button>
                  </>
                )}
                {editId && !imgPreview && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>תמונה קיימת תישמר</span>
                )}
                {/* גלריה — ללא capture */}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) scanImage(e.target.files[0]); }} />
                {/* מצלמה — עם capture */}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) scanImage(e.target.files[0]); }} />
              {imgPreview && (
                <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                  <img src={imgPreview} alt="" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 10, border: "1px solid rgba(99,179,237,0.3)" }} />
                  <button onClick={() => setImgPreview(null)} style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}
            </div>

            {/* רשת */}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>רשת</label>
              <select value={form.chain} onChange={e => setForm(f => ({ ...f, chain: e.target.value, customChain: "" }))}
                style={{ ...inp, appearance: "none" }}>
                <option value="">בחר רשת…</option>
                {CHAIN_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.chain === "אחר" && (
                <input style={{ ...inp, marginTop: 8 }} placeholder="שם הרשת / בית עסק" value={form.customChain}
                  onChange={e => setForm(f => ({ ...f, customChain: e.target.value }))} />
              )}
            </div>

            {/* קוד */}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>קוד שובר *</label>
              <input style={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="הכנס קוד" />
            </div>

            {/* תוקף */}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>תאריך תוקף</label>
              <input style={inp} type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
            </div>

            {/* ערך */}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>ערך / הטבה</label>
              <input style={inp} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="לדוגמה: ₪50 הנחה" />
            </div>

            {/* הערות */}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>הערות (מי נתן, לאיזה מוצר וכו׳)</label>
              <textarea style={{ ...inp, minHeight: 70 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="לדוגמה: קיבלתי מאמא, לקניית נעליים בלבד…" />
            </div>

            {/* הוסיף */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>מי הביא?</label>
              <select style={{ ...inp, appearance: "none" }} value={form.addedBy} onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))}>
                <option value="אני">אני</option>
                <option value="אישתי">אישתי</option>
                <option value="אחר">אחר</option>
              </select>
            </div>

            {/* כפתורים */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#3182ce,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "שומר..." : editId ? "💾 עדכן שובר" : "💾 שמור שובר"}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setImgPreview(null); }}
                style={{ padding: "12px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14 }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
