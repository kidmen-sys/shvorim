import { useState, useRef, useEffect, useCallback } from "react";
import { davidDb, aviDb } from "./firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

const BRANDS = {
  "רמי לוי":     { border: "#e8001a", balUrl: "https://ramilevydigital.mltp.co.il/?fireglass_rsn=true" },
  "סופר קרפור":  { border: "#003da5", balUrl: "https://tavplus.mltp.co.il/" },
  "שופרסל":      { border: "#00873c" },
  "ויקטורי":     { border: "#f97316" },
  "מגה ספורט":   { border: "#2d7a2d" },
  "מחסני להב":   { border: "#7c1c1c" },
  "BOOM":        { border: "#ca8a04" },
  "חבר":         { border: "#1e40af" },
  "מקדונלד'ס":   { border: "#da0004" },
  "פיצה שמש":    { border: "#d97706" },
  "פיצה סטורי":  { border: "#dc2626" },
  "פיצה האט":    { border: "#cc0000" },
  "דומינו'ס":    { border: "#006491" },
  "יינות ביתן":  { border: "#7e22ce" },
  "אחר":         { border: "#6b7280" },
};
const CHAIN_LIST = Object.keys(BRANDS);

const DETECT = [
  { r: /^RL[-\s]/i,         c: "רמי לוי" },
  { r: /^CR[-\s]/i,         c: "סופר קרפור" },
  { r: /^SH[-\s]/i,         c: "שופרסל" },
  { r: /^VIC/i,             c: "ויקטורי" },
  { r: /^MEGA/i,            c: "מגה ספורט" },
  { r: /^LAHAV/i,           c: "מחסני להב" },
  { r: /^BOOM/i,            c: "BOOM" },
  { r: /^HAVER|^CHAVER/i,   c: "חבר" },
  { r: /^MC[-\s]|^MCD/i,    c: "מקדונלד'ס" },
  { r: /^SHEMESH|^SHM/i,    c: "פיצה שמש" },
  { r: /^STORY|^STR[-\s]/i, c: "פיצה סטורי" },
  { r: /^PHT|^HATHUT/i,     c: "פיצה האט" },
  { r: /^DOM/i,             c: "דומינו'ס" },
  { r: /^YB[-\s]|^YEINOT/i, c: "יינות ביתן" },
];

const brand     = (c) => BRANDS[c] || BRANDS["אחר"];
const isSoon    = (e) => { if (!e) return false; const d = (new Date(e) - new Date()) / 86400000; return d >= 0 && d <= 7; };
const isExpired = (e) => e && new Date(e) < new Date();

// ─── לוגו ─────────────────────────────────────────────────────────
function Logo({ chain }) {
  const box = { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" };
  switch (chain) {
    case "רמי לוי":     return <div style={{ ...box, background: "#e8001a", flexDirection: "column" }}><span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1.1, textAlign: "center" }}>רמי<br />לוי</span></div>;
    case "סופר קרפור":  return <div style={{ ...box, background: "#003da5" }}><svg width="36" height="26" viewBox="0 0 90 60"><polygon points="45,30 20,5 20,55" fill="#ed1c24"/><polygon points="45,30 70,5 70,55" fill="#ed1c24"/><rect x="0" y="0" width="20" height="60" fill="#fff"/><rect x="70" y="0" width="20" height="60" fill="#fff"/></svg></div>;
    case "שופרסל":      return <div style={{ ...box, background: "#00873c" }}><span style={{ color: "#fff", fontSize: 11, fontWeight: 900, textAlign: "center", lineHeight: 1.1 }}>שופר<br />סל</span></div>;
    case "ויקטורי":     return <div style={{ ...box, background: "#f97316" }}><span style={{ color: "#fff", fontSize: 9, fontWeight: 900, textAlign: "center", lineHeight: 1.1 }}>ויק<br />טורי</span></div>;
    case "מגה ספורט":   return <div style={{ ...box, background: "#fff", flexDirection: "column", padding: 3 }}><div style={{ display: "flex", alignItems: "baseline", gap: 1 }}><span style={{ color: "#e8001a", fontSize: 14, fontWeight: 900, fontStyle: "italic" }}>מ</span><span style={{ color: "#2d7a2d", fontSize: 10, fontWeight: 900, fontStyle: "italic" }}>גה</span></div><span style={{ color: "#2d7a2d", fontSize: 8, fontWeight: 900, fontStyle: "italic" }}>ספורט</span></div>;
    case "מחסני להב":   return <div style={{ ...box, background: "#7c1c1c" }}><span style={{ color: "#f5c842", fontSize: 9, fontWeight: 900, textAlign: "center", lineHeight: 1.2 }}>מחסני<br />להב</span></div>;
    case "BOOM":        return <div style={{ ...box, background: "#fbbf24" }}><span style={{ color: "#1a1a1a", fontSize: 11, fontWeight: 900 }}>💥BOOM</span></div>;
    case "חבר":         return <div style={{ ...box, background: "#1e40af" }}><span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>חבר</span></div>;
    case "מקדונלד'ס":   return <div style={{ ...box, background: "#da0004" }}><svg width="28" height="24" viewBox="0 0 28 24"><path d="M4,22 Q4,2 8,2 Q11,2 14,12 Q17,2 20,2 Q24,2 24,22" stroke="#ffbc0d" strokeWidth="4.5" fill="none" strokeLinecap="round"/></svg></div>;
    case "פיצה שמש":    return <div style={{ ...box, background: "#fef3c7", flexDirection: "column" }}><span style={{ fontSize: 18, lineHeight: 1 }}>☀️</span><span style={{ color: "#92400e", fontSize: 7, fontWeight: 900 }}>שמש</span></div>;
    case "פיצה סטורי":  return <div style={{ ...box, background: "#dc2626", flexDirection: "column", gap: 1 }}><span style={{ fontSize: 16, lineHeight: 1 }}>🍕</span><span style={{ color: "#fff", fontSize: 7, fontWeight: 900 }}>סטורי</span></div>;
    case "פיצה האט":    return <div style={{ ...box, background: "#cc0000", flexDirection: "column" }}><span style={{ color: "#fff", fontSize: 7, fontWeight: 900, lineHeight: 1.2, textAlign: "center" }}>PIZZA<br />HUT</span></div>;
    case "דומינו'ס":    return <div style={{ ...box, background: "#006491" }}><svg width="30" height="30" viewBox="0 0 30 30"><rect x="1" y="1" width="12" height="28" rx="2" fill="#e31837"/><rect x="15" y="1" width="14" height="13" rx="2" fill="#e31837"/><rect x="15" y="16" width="14" height="13" rx="2" fill="#fff" opacity="0.25"/><circle cx="7" cy="8" r="2.5" fill="#fff"/><circle cx="7" cy="22" r="2.5" fill="#fff"/><circle cx="22" cy="7" r="2" fill="#fff"/></svg></div>;
    case "יינות ביתן":  return <div style={{ ...box, background: "#7e22ce", flexDirection: "column", gap: 1 }}><span style={{ fontSize: 16, lineHeight: 1 }}>🍷</span><span style={{ color: "#e9d5ff", fontSize: 7, fontWeight: 900, lineHeight: 1.1, textAlign: "center" }}>יינות<br />ביתן</span></div>;
    default:            return <div style={{ ...box, background: "#374151" }}><span style={{ fontSize: 18 }}>🏷️</span></div>;
  }
}

// ─── כפתור העתקה ──────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid #63b3ed", background: copied ? "rgba(76,175,80,0.2)" : "rgba(99,179,237,0.15)", color: copied ? "#4caf50" : "#63b3ed", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "all 0.2s" }}>
      {copied ? "✅ הועתק!" : "📋 העתק מספר שובר"}
    </button>
  );
}

const inp    = { width: "100%", padding: "9px 11px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 9, color: "#fff", fontSize: 13, outline: "none", direction: "rtl", fontFamily: "inherit", boxSizing: "border-box" };
const whoOn  = { background: "rgba(99,179,237,0.15)", border: "1px solid #63b3ed", color: "#63b3ed" };
const whoOff = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.5)" };

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", padding: "14px 16px 26px" }}>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 14px" }} />
        {children}
      </div>
    </div>
  );
}

function CouponCard({ coupon: c, open, onToggle, onMarkUsed, onRestore, onEdit, onDelete, onBalance, onViewImg }) {
  const col    = c.used ? "#ab47bc" : isExpired(c.expiry) ? "#f44336" : isSoon(c.expiry) ? "#ff9800" : "#4caf50";
  const lbl    = c.used ? "נוצל" : isExpired(c.expiry) ? "פג תוקף" : isSoon(c.expiry) ? "⚠️ פג בקרוב" : "פעיל";
  const bc     = brand(c.chain).border;
  const hasBal = !!brand(c.chain).balUrl;
  return (
    <div style={{ borderRadius: 13, background: "rgba(255,255,255,0.045)", overflow: "hidden", marginBottom: 9, border: `1px solid ${bc}33`, borderRight: `4px solid ${bc}` }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, cursor: "pointer", userSelect: "none" }}>
        <Logo chain={c.chain} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            {c.chain}
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, fontWeight: 700, background: `${col}22`, color: col }}>{lbl}</span>
            {hasBal && !c.used && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, fontWeight: 700, background: "rgba(99,179,237,0.14)", color: "#63b3ed", border: "1px solid #63b3ed44" }}>💳</span>}
            {c.image && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>📷</span>}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 2, fontFamily: "monospace" }}>{c.code}</div>
          {c.discount && <div style={{ fontSize: 11, color: "#68d391", marginTop: 2 }}>{c.discount}</div>}
          {c.notes && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1, fontStyle: "italic" }}>📝 {c.notes}</div>}
        </div>
        <div style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.32)", flexShrink: 0, lineHeight: 1.6 }}>
          {c.expiry && <><div>עד</div><div style={{ fontWeight: 700, color: isSoon(c.expiry) && !c.used ? "#ff9800" : undefined }}>{c.expiry}</div></>}
          <div>👤 {c.addedBy}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{open ? "▲" : "▼"}</div>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 12px 12px" }}>
          {c.image && (
            <img src={c.image} alt="שובר" onClick={onViewImg}
              style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 8, marginBottom: 10, background: "rgba(0,0,0,0.3)", display: "block", cursor: "zoom-in" }} />
          )}
          {c.used && c.usedDate && <div style={{ fontSize: 10, color: "#ab47bc", marginBottom: 8 }}>📅 נוצל בתאריך: {c.usedDate}</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {hasBal && !c.used && <button onClick={onBalance} style={{ flex: 2, padding: 8, borderRadius: 9, background: "rgba(99,179,237,0.12)", border: "1px solid #63b3ed", color: "#63b3ed", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💳 בדוק יתרה</button>}
            {!c.used && <button onClick={onMarkUsed} style={{ flex: 2, padding: 8, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#3182ce,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✅ סמן נוצל</button>}
            {c.used && <button onClick={onRestore} style={{ flex: 2, padding: 8, borderRadius: 9, border: "1px solid #4caf50", background: "rgba(76,175,80,0.12)", color: "#4caf50", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>↩️ החזר לפעילים</button>}
            <button onClick={onEdit} style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(245,158,11,0.12)", border: "1px solid #f59e0b", color: "#f59e0b", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ ערוך</button>
            <button onClick={onDelete} style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🗑️ מחק</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── סטטיסטיקות ───────────────────────────────────────────────────
function StatsView({ coupons, active, archived }) {
  // חילוץ סכום ממחרוזת הנחה
  const extractAmount = (discount) => {
    if (!discount) return 0;
    const m = discount.match(/(\d+[\d,.]*)/);
    if (!m) return 0;
    return parseFloat(m[1].replace(/,/g, "")) || 0;
  };

  const totalActive   = active.reduce((sum, c) => sum + extractAmount(c.discount), 0);
  const totalArchived = archived.reduce((sum, c) => sum + extractAmount(c.discount), 0);
  const totalAll      = totalActive + totalArchived;

  // סיכום לפי רשת
  const byChain = {};
  for (const c of active) {
    if (!byChain[c.chain]) byChain[c.chain] = { count: 0, total: 0 };
    byChain[c.chain].count++;
    byChain[c.chain].total += extractAmount(c.discount);
  }
  const chainList = Object.entries(byChain).sort((a, b) => b[1].total - a[1].total);

  // שוברים שפגים בקרוב
  const expiringSoon = active.filter(c => isSoon(c.expiry));
  const expired      = active.filter(c => isExpired(c.expiry));

  const fmt = (n) => n > 0 ? `${n.toLocaleString("he-IL")}₪` : "—";

  return (
    <div style={{ padding: "10px 14px 80px" }}>

      {/* סיכום כללי */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, letterSpacing: 0.5 }}>סיכום כללי</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "שווי פעילים",  val: fmt(totalActive),   color: "#4caf50", icon: "💰" },
            { label: "שווי נוצלו",   val: fmt(totalArchived), color: "#ab47bc", icon: "📦" },
            { label: "סה״כ הכל",    val: fmt(totalAll),      color: "#63b3ed", icon: "🏆" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 8px", textAlign: "center", border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* שוברים בסכנה */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>⚠️ דורש תשומת לב</div>
          <div style={{ display: "flex", gap: 8 }}>
            {expired.length > 0 && (
              <div style={{ flex: 1, background: "rgba(244,67,54,0.1)", borderRadius: 12, padding: "10px 12px", border: "1px solid #f4433644" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f44336" }}>{expired.length}</div>
                <div style={{ fontSize: 10, color: "#f44336", marginTop: 2 }}>פג תוקף</div>
                <div style={{ fontSize: 11, color: "#f44336", marginTop: 2, fontWeight: 600 }}>{fmt(expired.reduce((s,c) => s + extractAmount(c.discount), 0))}</div>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div style={{ flex: 1, background: "rgba(255,152,0,0.1)", borderRadius: 12, padding: "10px 12px", border: "1px solid #ff980044" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>{expiringSoon.length}</div>
                <div style={{ fontSize: 10, color: "#ff9800", marginTop: 2 }}>פגים תוך 7 ימים</div>
                <div style={{ fontSize: 11, color: "#ff9800", marginTop: 2, fontWeight: 600 }}>{fmt(expiringSoon.reduce((s,c) => s + extractAmount(c.discount), 0))}</div>
              </div>
            )}
            <div style={{ flex: 1, background: "rgba(76,175,80,0.1)", borderRadius: 12, padding: "10px 12px", border: "1px solid #4caf5044" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4caf50" }}>{active.filter(c => !isSoon(c.expiry) && !isExpired(c.expiry)).length}</div>
              <div style={{ fontSize: 10, color: "#4caf50", marginTop: 2 }}>תקינים</div>
              <div style={{ fontSize: 11, color: "#4caf50", marginTop: 2, fontWeight: 600 }}>{fmt(active.filter(c => !isSoon(c.expiry) && !isExpired(c.expiry)).reduce((s,c) => s + extractAmount(c.discount), 0))}</div>
            </div>
          </div>
        </div>
      )}

      {/* פירוט לפי רשת */}
      {chainList.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>פירוט לפי רשת (שוברים פעילים)</div>
          {chainList.map(([chain, data]) => (
            <div key={chain} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 7, border: `1px solid ${(BRANDS[chain]?.border || "#6b7280")}33`, borderRight: `3px solid ${BRANDS[chain]?.border || "#6b7280"}` }}>
              <Logo chain={chain} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{chain}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{data.count} שובר{data.count !== 1 ? "ים" : ""}</div>
              </div>
              <div style={{ textAlign: "left", direction: "ltr" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#4caf50" }}>{fmt(data.total)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {chainList.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.22)", fontSize: 13 }}>
          📊<br />אין נתונים להצגה
        </div>
      )}
    </div>
  );
}

export default function App({ dbKey }) {
  const db = dbKey === "avi" ? aviDb : davidDb;
  const [coupons, setCoupons]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [tab, setTab]                           = useState("active");
  const [filterChain, setFilterChain]           = useState("הכל");
  const [expandedId, setExpandedId]             = useState(null);
  const [showForm, setShowForm]                 = useState(false);
  const [editId, setEditId]                     = useState(null);
  const [saving, setSaving]                     = useState(false);
  const [showStats, setShowStats]               = useState(false);
  const [pendingUsedId, setPendingUsedId]       = useState(null);
  const [pendingRestoreId, setPendingRestoreId] = useState(null);
  const [balModal, setBalModal]                 = useState(null);
  const [imgViewer, setImgViewer]               = useState(null);
  const [form, setForm]                         = useState({ chain: "", customChain: "", code: "", expiry: "", discount: "", notes: "", addedBy: "אני" });
  const [imgPreview, setImgPreview]             = useState(null);
  const [analyzing, setAnalyzing]               = useState(false);
  const [aiMsg, setAiMsg]                       = useState(null);
  const fileRef = useRef();

  // ── Firebase ──────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const active      = coupons.filter((c) => !c.used);
  const archived    = coupons.filter((c) => c.used);
  const baseList    = tab === "active" ? active : archived;
  const list        = filterChain === "הכל" ? baseList : baseList.filter((c) => c.chain === filterChain);
  const chainsInTab = ["הכל", ...Array.from(new Set(baseList.map((c) => c.chain)))];

  // ── ניתוח תמונה ───────────────────────────────────────────────────
  const processFile = useCallback((file) => {
    if (!file) return;
    setAiMsg(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setImgPreview(dataUrl);
      setAnalyzing(true);
      try {
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mediaType: file.type || "image/jpeg" }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = (data.content || []).map(b => b.text || "").join("");
          try {
            const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
            setForm(f => ({
              ...f,
              code:     parsed.code     ? parsed.code.trim()     : f.code,
              expiry:   parsed.expiry   ? parsed.expiry.trim()   : f.expiry,
              discount: parsed.discount ? parsed.discount.trim() : f.discount,
            }));
            const found   = [parsed.code && "קוד", parsed.expiry && "תוקף", parsed.discount && "סכום"].filter(Boolean);
            const missing = [!parsed.code && "קוד", !parsed.expiry && "תוקף", !parsed.discount && "סכום"].filter(Boolean);
            setAiMsg({ type: "warn", text: found.length
              ? `✨ זיהיתי: ${found.join(", ")}${missing.length ? ` | השלם: ${missing.join(", ")}` : ""} — בחר רשת ידנית`
              : "📷 תמונה נטענה — מלא את הפרטים ידנית" });
          } catch {
            setAiMsg({ type: "ok", text: "📷 תמונה נטענה — מלא את הפרטים ידנית" });
          }
        } else {
          setAiMsg({ type: "ok", text: "📷 תמונה נטענה — מלא את הפרטים ידנית" });
        }
      } catch {
        setAiMsg({ type: "ok", text: "📷 תמונה נטענה — מלא את הפרטים ידנית" });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImage = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    processFile(file);
  }, [processFile]);

  // ── הדבקת תמונה Ctrl+V ───────────────────────────────────────────
  useEffect(() => {
    const onPaste = (e) => {
      if (!showForm || editId) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          processFile(item.getAsFile());
          break;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [showForm, editId, processFile]);

  // ── פורם ─────────────────────────────────────────────────────────
  const setField     = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const onCodeChange = (val) => {
    setField("code", val);
    if (!editId && !form.chain) {
      for (const d of DETECT) { if (d.r.test(val)) { setField("chain", d.c); break; } }
    }
  };

  const openAdd = () => {
    setEditId(null); setImgPreview(null); setAiMsg(null); setSaving(false);
    setForm({ chain: "", customChain: "", code: "", expiry: "", discount: "", notes: "", addedBy: "אני" });
    setShowForm(true);
  };
  const openEdit = (c) => {
    setEditId(c.id); setImgPreview(c.image || null); setAiMsg(null); setSaving(false);
    setForm({ chain: c.chain, customChain: "", code: c.code, expiry: c.expiry || "", discount: c.discount || "", notes: c.notes || "", addedBy: c.addedBy || "אני" });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setSaving(false); };

  const save = async () => {
    if (saving) return;
    // קבע שם רשת — אם "אחר" עם שם מותאם, השתמש בו
    const chainName = (form.chain === "אחר" && form.customChain.trim())
      ? form.customChain.trim()
      : form.chain || "אחר";
    const codeVal = form.code.trim();
    // בדיקת כפילות רק אם יש קוד
    if (codeVal && !editId) {
      const dup = coupons.find(c => c.code.trim().toLowerCase() === codeVal.toLowerCase());
      if (dup) { alert(`שובר עם הקוד "${codeVal}" כבר קיים!`); return; }
    }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "coupons", editId), { chain: chainName, code: codeVal, expiry: form.expiry, discount: form.discount, notes: form.notes, addedBy: form.addedBy });
      } else {
        await addDoc(collection(db, "coupons"), { chain: chainName, code: codeVal, expiry: form.expiry, discount: form.discount, notes: form.notes, addedBy: form.addedBy, used: false, image: imgPreview || null, createdAt: serverTimestamp() });
      }
      closeForm();
      if (!editId) setTab("active");
    } catch (err) { alert("שגיאה: " + err.message); setSaving(false); }
  };

  const confirmUsed = async () => {
    if (!pendingUsedId) return;
    await updateDoc(doc(db, "coupons", pendingUsedId), { used: true, usedDate: new Date().toISOString().slice(0, 10) });
    setPendingUsedId(null); setExpandedId(null);
  };
  const confirmRestore = async () => {
    if (!pendingRestoreId) return;
    await updateDoc(doc(db, "coupons", pendingRestoreId), { used: false, usedDate: null });
    setPendingRestoreId(null); setExpandedId(null); setTab("active");
  };
  const deleteCoupon = async (id) => {
    if (!window.confirm("למחוק את השובר לצמיתות?")) return;
    await deleteDoc(doc(db, "coupons", id));
    if (expandedId === id) setExpandedId(null);
  };

  const aiBg = { ok: "rgba(99,179,237,0.1)", warn: "rgba(245,158,11,0.1)", err: "rgba(239,68,68,0.1)" };
  const aiBr = { ok: "rgba(99,179,237,0.3)", warn: "rgba(245,158,11,0.3)", err: "rgba(239,68,68,0.3)" };
  const aiCl = { ok: "#63b3ed", warn: "#fcd34d", err: "#fc8181" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#0d1b2a,#1a2838)", fontFamily: "'Heebo','Segoe UI',Arial,sans-serif", direction: "rtl", color: "#e8f0fe" }}>

      <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.09)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>🎟️ שוברים וחיסכון</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{loading ? "🔄 מתחבר..." : `✅ מסונכרן • ${active.length} פעילים`}</div>
        </div>
        <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#3182ce,#2563eb)", border: "none", borderRadius: 10, padding: "9px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+ הוסף שובר</button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 14px 0" }}>
        {[
          { label: "🎟️ פעילים",     val: active.length,                                color: "#4caf50" },
          { label: "📦 נוצלו",      val: archived.length,                              color: "#ab47bc" },
          { label: "⚠️ פגים בקרוב", val: active.filter((c) => isSoon(c.expiry)).length, color: "#ff9800" },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 7, padding: "10px 14px 0" }}>
        {[{ k: "active", l: "📋 פעילים", n: active.length }, { k: "archive", l: "📦 ארכיון", n: archived.length }].map((t) => (
          <button key={t.k} onClick={() => { setTab(t.k); setExpandedId(null); setFilterChain("הכל"); setShowStats(false); }} style={{
            flex: 1, borderRadius: 9, padding: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            fontWeight: tab === t.k && !showStats ? 700 : 500,
            background: tab === t.k && !showStats ? "rgba(99,179,237,0.14)" : "rgba(255,255,255,0.04)",
            border:     tab === t.k && !showStats ? "1px solid #63b3ed"     : "1px solid rgba(255,255,255,0.09)",
            color:      tab === t.k && !showStats ? "#63b3ed"               : "rgba(255,255,255,0.4)",
          }}>{t.l} ({t.n})</button>
        ))}
        <button onClick={() => { setShowStats(true); setExpandedId(null); }} style={{
          flex: 1, borderRadius: 9, padding: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          fontWeight: showStats ? 700 : 500,
          background: showStats ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.04)",
          border:     showStats ? "1px solid #f59e0b"     : "1px solid rgba(255,255,255,0.09)",
          color:      showStats ? "#f59e0b"               : "rgba(255,255,255,0.4)",
        }}>📊 סטטיסטיקה</button>
      </div>

      {showStats && <StatsView coupons={coupons} active={active} archived={archived} onClose={() => setShowStats(false)} />}

      {!showStats && chainsInTab.length > 2 && (
        <div style={{ padding: "8px 14px 0", overflowX: "auto", display: "flex", gap: 6, WebkitOverflowScrolling: "touch" }}>
          {chainsInTab.map((ch) => (
            <button key={ch} onClick={() => setFilterChain(ch)} style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 20, fontSize: 11,
              cursor: "pointer", fontFamily: "inherit", fontWeight: filterChain === ch ? 700 : 500,
              background: filterChain === ch ? "rgba(99,179,237,0.18)" : "rgba(255,255,255,0.05)",
              border:     filterChain === ch ? "1px solid #63b3ed"     : "1px solid rgba(255,255,255,0.1)",
              color:      filterChain === ch ? "#63b3ed"               : "rgba(255,255,255,0.45)",
              whiteSpace: "nowrap",
            }}>{ch === "הכל" ? `הכל (${baseList.length})` : ch}</button>
          ))}
        </div>
      )}

      <div style={{ padding: "10px 14px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>🔄 טוען...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.22)", fontSize: 13, lineHeight: 3 }}>
            {tab === "active" ? "🎟️" : "📦"}<br />
            {filterChain !== "הכל" ? `אין שוברים של ${filterChain}` : tab === "active" ? "אין שוברים פעילים" : "הארכיון ריק"}
          </div>
        ) : list.map((c) => (
          <CouponCard key={c.id} coupon={c}
            open={expandedId === c.id}
            onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
            onMarkUsed={() => setPendingUsedId(c.id)}
            onRestore={() => setPendingRestoreId(c.id)}
            onEdit={() => openEdit(c)}
            onDelete={() => deleteCoupon(c.id)}
            onBalance={() => setBalModal({ chain: c.chain, url: brand(c.chain).balUrl, code: c.code })}
            onViewImg={() => c.image && setImgViewer(c.image)}
          />
        ))}
      </div>}

      {/* מודל הוספה/עריכה */}
      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            {editId ? <>✏️ עריכת שובר <span style={{ fontSize: 11, fontWeight: 500, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b44", padding: "2px 8px", borderRadius: 20 }}>עריכה</span></> : "➕ שובר חדש"}
          </div>

          {!editId && (
            <>
              {imgPreview ? (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ position: "relative" }}>
                    <img src={imgPreview} alt="" onClick={() => setImgViewer(imgPreview)}
                      style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 10, background: "rgba(0,0,0,0.3)", cursor: "zoom-in", display: "block" }} />
                    {analyzing && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(10,16,30,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10 }}>
                        <span style={{ fontSize: 26, animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</span>
                        <span style={{ fontSize: 12, color: "#63b3ed", fontWeight: 600 }}>מנתח תמונה...</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(99,179,237,0.4)", background: "rgba(99,179,237,0.08)", color: "#63b3ed", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🔄 החלף</button>
                    <button onClick={() => setImgViewer(imgPreview)} style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🔍 הגדל</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => fileRef.current.click()}
                  style={{ border: "2px dashed rgba(99,179,237,0.4)", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", marginBottom: 10, minHeight: 88, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <div style={{ fontSize: 28 }}>📷</div>
                  <div style={{ fontSize: 12, color: "#63b3ed", fontWeight: 600 }}>לחץ לבחירת תמונה</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>או הדבק תמונה (Ctrl+V)</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
              {aiMsg && (
                <div style={{ background: aiBg[aiMsg.type], border: `1px solid ${aiBr[aiMsg.type]}`, borderRadius: 8, padding: "7px 11px", fontSize: 11, color: aiCl[aiMsg.type], marginBottom: 10, lineHeight: 1.5 }}>
                  {aiMsg.text}
                </div>
              )}
            </>
          )}

          {editId && imgPreview && (
            <div style={{ marginBottom: 12 }}>
              <img src={imgPreview} alt="" onClick={() => setImgViewer(imgPreview)}
                style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 8, background: "rgba(0,0,0,0.3)", cursor: "zoom-in", display: "block" }} />
              <button onClick={() => setImgViewer(imgPreview)} style={{ width: "100%", marginTop: 5, padding: "5px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🔍 הגדל תמונה</button>
            </div>
          )}

          {[
            { key: "chain",    label: "רשת",        type: "select" },
            { key: "customChain", label: "שם הרשת", type: "custom", placeholder: "הכנס שם רשת", showIf: form.chain === "אחר" },
            { key: "code",     label: "מספר שובר",  placeholder: "הכנס מספר שובר" },
            { key: "expiry",   label: "תוקף עד",    type: "date" },
            { key: "discount", label: "ערך / הטבה", placeholder: "לדוגמה: שובר 200₪" },
            { key: "notes", label: "הערות", placeholder: "הערות נוספות על השובר (לא חובה)" },
          ].filter(f => !f.showIf !== undefined ? f.showIf !== false : true).map((f) => {
            if (f.showIf === false) return null;
            return (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", display: "block", marginBottom: 4 }}>{f.label}</label>
                {f.type === "select"
                  ? <select value={form.chain} onChange={(e) => setField("chain", e.target.value)} style={{ ...inp }}>
                      <option value="">בחר רשת</option>
                      {CHAIN_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  : <input type={f.type === "custom" ? "text" : f.type || "text"} value={form[f.key]} onChange={(e) => f.key === "code" ? onCodeChange(e.target.value) : setField(f.key, e.target.value)} placeholder={f.placeholder} style={inp} />}
              </div>
            );
          })}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", display: "block", marginBottom: 4 }}>הוסף על ידי</label>
            <div style={{ display: "flex", gap: 7 }}>
              {["אני", "אישתי"].map((w) => (
                <button key={w} onClick={() => setField("addedBy", w)} style={{ flex: 1, padding: 8, borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", ...(form.addedBy === w ? whoOn : whoOff) }}>{w}</button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            style={{ width: "100%", padding: 12, borderRadius: 11, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", background: saving ? "rgba(255,255,255,0.15)" : editId ? "linear-gradient(135deg,#d97706,#b45309)" : "linear-gradient(135deg,#3182ce,#2563eb)", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ שומר..." : editId ? "💾 עדכן שובר" : "💾 שמור שובר"}
          </button>
          <button onClick={closeForm} style={{ width: "100%", padding: 9, borderRadius: 11, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 7, fontFamily: "inherit" }}>ביטול</button>
        </Modal>
      )}

      {pendingUsedId && (
        <Modal onClose={() => setPendingUsedId(null)}>
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>סמן כנוצל?</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 20 }}>השובר יועבר לארכיון</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPendingUsedId(null)} style={{ flex: 1, padding: 10, borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
              <button onClick={confirmUsed} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3182ce,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>כן, נוצל!</button>
            </div>
          </div>
        </Modal>
      )}

      {pendingRestoreId && (
        <Modal onClose={() => setPendingRestoreId(null)}>
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>↩️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>להחזיר לפעילים?</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 20 }}>השובר יחזור לרשימה הפעילה</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPendingRestoreId(null)} style={{ flex: 1, padding: 10, borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
              <button onClick={confirmRestore} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4caf50,#388e3c)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>כן, החזר!</button>
            </div>
          </div>
        </Modal>
      )}

      {balModal && (
        <Modal onClose={() => setBalModal(null)}>
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>בדיקת יתרה</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 18 }}>{balModal.chain}</div>
            <div style={{ background: "rgba(99,179,237,0.08)", border: "1px solid rgba(99,179,237,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>מספר השובר שלך</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color: "#63b3ed", letterSpacing: 2, marginBottom: 12 }}>{balModal.code}</div>
              <CopyBtn text={balModal.code} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginBottom: 18, lineHeight: 2 }}>
              1️⃣ לחץ "העתק"<br />2️⃣ לחץ "פתח אתר" — יפתח בלשונית חדשה<br />3️⃣ הדבק ובדוק יתרה
            </div>
            <a href={balModal.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", width: "100%", padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#3182ce,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 8, boxSizing: "border-box", textAlign: "center" }}>
              🌐 פתח אתר בדיקת יתרה
            </a>
            <button onClick={() => setBalModal(null)} style={{ width: "100%", padding: 9, borderRadius: 11, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>סגור</button>
          </div>
        </Modal>
      )}

      {/* תצוגת תמונה מלאה */}
      {imgViewer && (
        <div onClick={() => setImgViewer(null)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <img src={imgViewer} alt="" style={{ maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} />
            <button onClick={() => setImgViewer(null)}
              style={{ position: "absolute", top: -14, left: -14, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>לחץ ✕ או מחוץ לתמונה לסגירה</div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        select option { background: #1a1a2e; color: #fff; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
        body { margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
