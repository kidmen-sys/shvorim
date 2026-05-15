// src/Login.jsx
import { useState } from "react";

const VALID_USER = "DAVID";
const VALID_PASS = "24111982";
const STORAGE_KEY = "sv_auth";

export function isAuthenticated() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function Login({ onLogin }) {
  const [user, setUser]       = useState("");
  const [pass, setPass]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (user.trim().toUpperCase() === VALID_USER && pass === VALID_PASS) {
        localStorage.setItem(STORAGE_KEY, "1");
        onLogin();
      } else {
        setError("שם משתמש או סיסמה שגויים");
      }
      setLoading(false);
    }, 600);
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  const inp = {
    width: "100%", padding: "12px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12, color: "#fff", fontSize: 15,
    outline: "none", direction: "rtl",
    fontFamily: "'Heebo','Segoe UI',Arial,sans-serif",
    boxSizing: "border-box", marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(145deg,#0d1b2a,#1a2838)",
      fontFamily: "'Heebo','Segoe UI',Arial,sans-serif",
      direction: "rtl", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Logo / title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎟️</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e8f0fe" }}>שוברים וחיסכון</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>ניהול שוברים משפחתי</div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "28px 24px",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e8f0fe", marginBottom: 20 }}>כניסה למערכת</div>

          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 5 }}>שם משתמש</label>
          <input
            style={inp}
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            onKeyDown={onKey}
            placeholder="הכנס שם משתמש"
            autoComplete="username"
          />

          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 5 }}>סיסמה</label>
          <input
            style={{ ...inp, marginBottom: 0 }}
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={onKey}
            placeholder="הכנס סיסמה"
            autoComplete="current-password"
          />

          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#fc8181", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "7px 12px" }}>
              ❌ {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%", marginTop: 20, padding: "13px",
              borderRadius: 12, border: "none",
              background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#3182ce,#2563eb)",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: loading ? "none" : "0 4px 18px rgba(49,130,206,0.35)",
            }}
          >
            {loading ? "בודק..." : "🔐 כניסה"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          גישה מורשית בלבד
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800&display=swap');
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}
