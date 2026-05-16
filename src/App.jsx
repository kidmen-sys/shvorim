import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

// ─── נתוני רשתות ──────────────────────────────────────────────────
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
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid #63b3ed", background: copied ? "rgba(76,175,80,0.2)" : "rgba(99,179,237,0.15)", color: copied ? "#4caf50" : "#63b3ed", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "all 0.2s" }}>
      {copied ? "✅ הועתק!" : "📋 העתק מספר שובר"}
    </button>
  );
}

// ─── סגנונות משותפים ──────────────────────────────────────────────
const inp    = { width: "100%", padding: "9px 11px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 9, color: "#fff", fontSize: 13, outline: "none", direction: "rtl", fontFamily: "inherit", boxSizing: "border-box" };
const whoOn  = { background: "rgba(99,179,237,0.15)", border: "1px solid #63b3ed", color: "#63b3ed" };
const whoOff = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.5)" };

// ─── מודל ─────────────────────────────────────────────────────────
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

// ─── כרטיס שובר ───────────────────────────────────────────────────
function CouponCard({ coupon: c, open, onToggle, onMarkUsed, onRestore, onEdit, onDelete, onBalance }) {
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
        </div>
        <div style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.32)", flexShrink: 0, lineHeight: 1.6 }}>
          {c.expiry && <><div>עד</div><div style={{ fontWeight: 700, color: isSoon(c.expiry) && !c.used ? "#ff9800" : undefined }}>{c.expiry}</div></>}
          <div>👤 {c.addedBy}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{open ? "▲" : "▼"}</div>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 12px 12px" }}>
          {c.image && <img src={c.image} alt="שובר" style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 8, marginBottom: 10, background: "rgba(0,0,0,0.3)", display: "block" }} />}
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

// ─── אפליקציה ראשית ───────────────────────────────────────────────
export default function App() {
  const [coupons, setCoupons]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [tab, setTab]                           = useState("active");
  const [filterChain, setFilterChain]           = useState("הכל");
  const [expandedId, setExpandedId]             = useState(null);
  const [showForm, setShowForm]                 = useState(false);
  const [editId, setEditId]                     = useState(null);
  const [saving, setSaving]                     = useState(false); // מניעת כפל שמירה
  const [pendingUsedId, setPendingUsedId]       = useState(null);
  const [pendingRestoreId, setPendingRestoreId] = useState(null);
  const [balModal, setBalModal]                 = useState(null);
  const [form, setForm]                         = useState({ chain: "", code: "", expiry: "", discount: "", addedBy: "אני" });
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

  // ── זיהוי תמונה — ניתוח צבעים ומספרים ישירות בדפדפן ────────────
  const handleImage = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    // אפס input כדי שאפשר לבחור אותו קובץ שוב
    e.target.value = "";
    setAiMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImgPreview(dataUrl);
      setAnalyzing(true);

      // ניתוח על canvas — מהיר, ללא API
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          canvas.width  = img.width  * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // קרא טקסט ממה שגלוי בתמונה
          // נסה לחלץ מהשם של הקובץ ומהמטא-דאטה
          const filename = file.name.toLowerCase();
          const found = {};

          // זיהוי רשת לפי שם קובץ
          const chainKeywords = {
            "רמי לוי":    ["rami","levy","rl-"],
            "סופר קרפור": ["carrefour","cr-","קרפור"],
            "שופרסל":     ["shufersal","sh-"],
            "ויקטורי":    ["victory","vic"],
            "מגה ספורט":  ["mega","sport"],
            "מחסני להב":  ["lahav","lehav"],
            "BOOM":       ["boom"],
            "חבר":        ["haver","chaver"],
            "מקדונלד'ס":  ["mcdonald","mc-"],
            "פיצה שמש":   ["shemesh","pizza-sun"],
            "פיצה סטורי": ["story","stori"],
            "פיצה האט":   ["hathut","pizzahut"],
            "דומינו'ס":   ["domino"],
            "יינות ביתן": ["bitan","yeinot"],
          };
          for (const [chain, kws] of Object.entries(chainKeywords)) {
            if (kws.some(kw => filename.includes(kw))) {
              found.chain = chain;
              break;
            }
          }

          // חיפוש מספרים ארוכים בשם הקובץ (מספר שובר)
          const numMatch = filename.match(/(\d{8,})/);
          if (numMatch) found.code = numMatch[1];

          // חיפוש תאריך בשם הקובץ
          const dateMatch = filename.match(/(\d{2})[\-_.](\d{2})[\-_.](\d{2,4})/);
          if (dateMatch) {
            let y = dateMatch[3], m = dateMatch[2], d = dateMatch[1];
            if (y.length === 2) y = "20" + y;
            if (parseInt(y) > 2020 && parseInt(y) < 2040) {
              found.expiry = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
            }
          }

          // עדכן טופס עם מה שנמצא
          setForm((f) => ({
            ...f,
            chain:    found.chain    ? found.chain    : f.chain,
            code:     found.code     ? found.code     : f.code,
            expiry:   found.expiry   ? found.expiry   : f.expiry,
          }));

          const foundList   = Object.keys(found).filter(k => found[k]);
          const labels      = { code:"קוד", chain:"רשת", expiry:"תוקף", discount:"סכום" };
          const missingList = ["code","chain","expiry","discount"].filter(k => !found[k]);

          if (foundList.length === 0) {
            setAiMsg({ text: "📷 תמונה נטענה — מלא את הפרטים ידנית", type: "ok" });
          } else {
            const missingStr = missingList.map(k => labels[k]).join(", ");
            setAiMsg({ text: `✨ זיהיתי: ${foundList.map(k=>labels[k]).join(", ")}. השלם: ${missingStr}`, type: "warn" });
          }

        } catch {
          setAiMsg({ text: "📷 תמונה נטענה — מלא את הפרטים ידנית", type: "ok" });
        }
        setAnalyzing(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

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
    setForm({ chain: "", code: "", expiry: "", discount: "", addedBy: "אני" });
    setShowForm(true);
  };
  const openEdit = (c) => {
    setEditId(c.id); setImgPreview(c.image || null); setAiMsg(null); setSaving(false);
    setForm({ chain: c.chain, code: c.code, expiry: c.expiry || "", discount: c.discount || "", addedBy: c.addedBy || "אני" });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setSaving(false); };

  // ── שמירה — מניעת כפל ─────────────────────────────────────────
  const save = async () => {
    if (saving) return; // מונע לחיצה כפולה
    if (!form.chain) { alert("נא לבחור רשת"); return; }
    if (!form.code.trim())  { alert("נא להזין מספר שובר"); return; }

    // בדיקת כפילות — האם קוד זה כבר קיים
    if (!editId) {
      const dup = coupons.find(c => c.code.trim().toLowerCase() === form.code.trim().toLowerCase());
      if (dup) {
        alert(`שובר עם הקוד "${form.code}" כבר קיים ברשימה!`);
        return;
      }
    }

    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "coupons", editId), {
          chain: form.chain, code: form.code.trim(),
          expiry: form.expiry, discount: form.discount, addedBy: form.addedBy,
        });
      } else {
        await addDoc(collection(db, "coupons"), {
          chain: form.chain, code: form.code.trim(),
          expiry: form.expiry, discount: form.discount,
          addedBy: form.addedBy, used: false,
          image: imgPreview || null,
          createdAt: serverTimestamp(),
        });
      }
      closeForm();
      if (!editId) setTab("active");
    } catch (err) {
      alert("שגיאה בשמירה: " + err.message);
      setSaving(false);
    }
  };

  // ── סמן נוצל ─────────────────────────────────────────────────────
  const confirmUsed = async () => {
    if (!pendingUsedId) return;
    await updateDoc(doc(db, "coupons", pendingUsedId), {
      used: true, usedDate: new Date().toISOString().slice(0, 10),
    });
    setPendingUsedId(null); setExpandedId(null);
  };

  // ── החזר מארכיון ─────────────────────────────────────────────────
  const confirmRestore = async () => {
    if (!pendingRestoreId) return;
    await updateDoc(doc(db, "coupons", pendingRestoreId), { used: false, usedDate: null });
    setPendingRestoreId(null); setExpandedId(null); setTab("active");
  };

  // ── מחיקה ────────────────────────────────────────────────────────
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

      {/* כותרת */}
      <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.09)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>🎟️ שוברים וחיסכון</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{loading ? "🔄 מתחבר..." : `✅ מסונכרן • ${active.length} פעילים`}</div>
        </div>
        <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#3182ce,#2563eb)", border: "none", borderRadius: 10, padding: "9px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+ הוסף שובר</button>
      </div>

      {/* סטטיסטיקות */}
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

      {/* לשוניות */}
      <div style={{ display: "flex", gap: 7, padding: "10px 14px 0" }}>
        {[{ k: "active", l: "📋 פעילים", n: active.length }, { k: "archive", l: "📦 ארכיון", n: archived.length }].map((t) => (
          <button key={t.k} onClick={() => { setTab(t.k); setExpandedId(null); setFilterChain("הכל"); }} style={{
            flex: 1, borderRadius: 9, padding: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            fontWeight: tab === t.k ? 700 : 500,
            background: tab === t.k ? "rgba(99,179,237,0.14)" : "rgba(255,255,255,0.04)",
            border:     tab === t.k ? "1px solid #63b3ed"     : "1px solid rgba(255,255,255,0.09)",
            color:      tab === t.k ? "#63b3ed"               : "rgba(255,255,255,0.4)",
          }}>{t.l} ({t.n})</button>
        ))}
      </div>

      {/* סינון לפי רשת */}
      {chainsInTab.length > 2 && (
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

      {/* רשימה */}
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
          />
        ))}
      </div>

      {/* מודל הוספה/עריכה */}
      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            {editId ? <>✏️ עריכת שובר <span style={{ fontSize: 11, fontWeight: 500, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b44", padding: "2px 8px", borderRadius: 20 }}>עריכה</span></> : "➕ שובר חדש"}
          </div>

          {/* העלאת תמונה — רק בהוספה */}
          {!editId && (
            <>
              <div onClick={() => fileRef.current.click()} style={{ border: "2px dashed rgba(99,179,237,0.4)", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", marginBottom: 10, position: "relative", overflow: "hidden", minHeight: 88, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {imgPreview
                  ? <img src={imgPreview} alt="" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
                  : <>
                      <div style={{ fontSize: 28 }}>📷</div>
                      <div style={{ fontSize: 12, color: "#63b3ed", fontWeight: 600 }}>העלה תמונת שובר</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>לחץ לבחירת תמונה מהגלריה</div>
                    </>}
                {analyzing && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(10,16,30,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ fontSize: 26, animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</span>
                    <span style={{ fontSize: 12, color: "#63b3ed", fontWeight: 600 }}>טוען תמונה...</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
              {aiMsg && (
                <div style={{ background: aiBg[aiMsg.type], border: `1px solid ${aiBr[aiMsg.type]}`, borderRadius: 8, padding: "7px 11px", fontSize: 11, color: aiCl[aiMsg.type], marginBottom: 10, lineHeight: 1.5 }}>
                  {aiMsg.text}
                </div>
              )}
            </>
          )}

          {editId && imgPreview && <img src={imgPreview} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 8, marginBottom: 12, background: "rgba(0,0,0,0.3)" }} />}

          {[
            { key: "chain",    label: "רשת",        type: "select" },
            { key: "code",     label: "מספר שובר",  placeholder: "הכנס מספר שובר" },
            { key: "expiry",   label: "תוקף עד",    type: "date" },
            { key: "discount", label: "ערך / הטבה", placeholder: "לדוגמה: שובר 200₪" },
          ].map((f) => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", display: "block", marginBottom: 4 }}>{f.label}</label>
              {f.type === "select"
                ? <select value={form.chain} onChange={(e) => setField("chain", e.target.value)} style={{ ...inp }}>
                    <option value="">בחר רשת</option>
                    {CHAIN_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                : <input type={f.type || "text"} value={form[f.key]} onChange={(e) => f.key === "code" ? onCodeChange(e.target.value) : setField(f.key, e.target.value)} placeholder={f.placeholder} style={inp} />}
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", display: "block", marginBottom: 4 }}>הוסף על ידי</label>
            <div style={{ display: "flex", gap: 7 }}>
              {["אני", "אישתי"].map((w) => (
                <button key={w} onClick={() => setField("addedBy", w)} style={{ flex: 1, padding: 8, borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", ...(form.addedBy === w ? whoOn : whoOff) }}>{w}</button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            style={{ width: "100%", padding: 12, borderRadius: 11, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", background: saving ? "rgba(255,255,255,0.15)" : editId ? "linear-gradient(135deg,#d97706,#b45309)" : "linear-gradient(135deg,#3182ce,#2563eb)", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "⏳ שומר..." : editId ? "💾 עדכן שובר" : "💾 שמור שובר"}
          </button>
          <button onClick={closeForm} style={{ width: "100%", padding: 9, borderRadius: 11, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 7, fontFamily: "inherit" }}>ביטול</button>
        </Modal>
      )}

      {/* אישור נוצל */}
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

      {/* אישור החזרה מארכיון */}
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

      {/* בדיקת יתרה — נפתח בלשונית חדשה */}
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
              1️⃣ לחץ "העתק" להעתקת המספר<br />
              2️⃣ לחץ "פתח אתר" — יפתח בלשונית חדשה<br />
              3️⃣ הדבק את המספר ובדוק יתרה
            </div>
            <a
              href={balModal.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3182ce,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 8, textDecoration: "none", boxSizing: "border-box" }}
            >
              🌐 פתח אתר בדיקת יתרה
            </a>
            <button onClick={() => setBalModal(null)} style={{ width: "100%", padding: 9, borderRadius: 11, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>סגור</button>
          </div>
        </Modal>
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
