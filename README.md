# 🎟️ שוברים וחיסכון — הוראות התקנה ופריסה

## מה תצטרך (הכל חינמי)
- חשבון Google
- חשבון GitHub: https://github.com (הרשם אם אין לך)
- חשבון Vercel: https://vercel.com (הרשם עם Google)
- Node.js: https://nodejs.org (הורד LTS)

---

## שלב 1 — צור מסד נתונים Firebase

1. היכנס ל: https://console.firebase.google.com
2. לחץ **"Add project"** → שם: `shvorim-vachisachon` → Continue
3. כבה Google Analytics → **Create project**
4. בתפריט שמאל לחץ **Firestore Database**
5. לחץ **"Create database"** → **"Start in test mode"** → Next → Enable
6. לחץ ⚙️ **Project settings** (גלגל שיניים)
7. גלול למטה → לחץ **`</>`** (Web) → Register app (שם: `shvorim`)
8. **העתק את כל הבלוק של `firebaseConfig`** — תצטרך אותו בשלב הבא

---

## שלב 2 — הגדר את Firebase בקוד

פתח את הקובץ: `src/firebase.js`

החלף את השורות עם YOUR_... בפרטים שהעתקת:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "shvorim-vachisachon.firebaseapp.com",
  projectId:         "shvorim-vachisachon",
  storageBucket:     "shvorim-vachisachon.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc..."
};
```

---

## שלב 3 — בדוק שעובד במחשב

פתח טרמינל בתיקיית הפרויקט:

```bash
npm install
npm run dev
```

פתח דפדפן בכתובת: http://localhost:5173
אם האפליקציה נטענת — הכל תקין!

---

## שלב 4 — העלה ל-GitHub

```bash
# אתחל Git (פעם ראשונה בלבד)
git init
git add .
git commit -m "first commit"

# צור repository ב-GitHub ואז:
git remote add origin https://github.com/YOUR_USERNAME/shvorim.git
git branch -M main
git push -u origin main
```

---

## שלב 5 — פרוס ב-Vercel (חינמי לצמיתות)

1. היכנס ל: https://vercel.com
2. לחץ **"Add New Project"**
3. בחר את ה-repository שיצרת ב-GitHub
4. לחץ **Deploy** — Vercel בונה ומפרס אוטומטית!
5. תקבל קישור כמו: `https://shvorim.vercel.app`

**שלח את הקישור לאישתך — שתיכם מחוברים לאותו מסד נתונים בזמן אמת!**

---

## הוספה למסך הבית כאפליקציה

### iPhone (Safari):
לחץ Share → "Add to Home Screen" → Add

### Android (Chrome):
תפריט ⋮ → "Add to Home screen" → Add

---

## עדכון האפליקציה בעתיד

כשתרצה לשנות משהו, פשוט:
```bash
git add .
git commit -m "עדכון"
git push
```
Vercel יעדכן אוטומטית תוך דקה!

---

## שאלות?
שאל את Claude 😊
