import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Login, { isAuthenticated } from "./Login";


function Root() {
  const [authed, setAuthed] = useState(isAuthenticated());
  return authed ? <App /> : <Login onLogin={() => setAuthed(true)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
