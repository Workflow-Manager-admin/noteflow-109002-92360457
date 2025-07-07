import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Notes API base URL (adjust if needed according to backend deployment)
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

/**
 * Helper to get JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * Helper to set JWT token into localStorage
 */
function setToken(token) {
  localStorage.setItem("token", token);
}

/**
 * Helper to remove JWT token and log out
 */
function clearToken() {
  localStorage.removeItem("token");
}

/**
 * Wrapper for authenticated API requests
 */
async function apiRequest(endpoint, method = "GET", body = null) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    let err;
    try {
      err = await response.json();
    } catch {
      err = { detail: response.statusText };
    }
    throw err;
  }
  if (response.status !== 204) {
    return await response.json();
  }
  return null;
}

/**
 * Top navigation bar
 */
function Navbar({ onThemeToggle, theme, user, onLogout }) {
  return (
    <nav
      className="navbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 22, color: "var(--text-primary)" }}>
        📝 NoteFlow
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {user && (
          <span style={{ color: "var(--text-primary)", fontSize: 16 }}>
            Hello, <strong>{user.username}</strong>
          </span>
        )}
        <button className="theme-toggle" onClick={onThemeToggle}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {user && (
          <button className="btn" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

/**
 * Login/register form
 */
function AuthForm({ onAuth, loading }) {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onAuth({ username, password, mode });
    } catch (err) {
      setError(err?.detail || "Authentication failed");
    }
  };

  return (
    <div className="auth-container" style={authContainerStyle}>
      <form className="auth-form" style={authFormStyle} onSubmit={handleSubmit} autoComplete="on">
        <h2 style={{ marginBottom: 12 }}>
          {mode === "login" ? "Sign in to your account" : "Register"}
        </h2>
        <input
          style={inputStyle}
          type="text"
          value={username}
          placeholder="Username"
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          value={password}
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div style={errorStyle}>{error}</div>}
        <button style={btnStyle} className="btn" type="submit" disabled={loading}>
          {loading
            ? (mode === "login" ? "Logging in..." : "Registering...")
            : (mode === "login" ? "Login" : "Register")}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          style={switchModeStyle}
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          disabled={loading}
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Have an account? Login"}
        </button>
      </form>
    </div>
  );
}

// Style objects for Auth UI
const authContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "80vh",
};
const authFormStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "2rem",
  border: "1px solid var(--border-color)",
  borderRadius: "12px",
  background: "var(--bg-secondary)",
  minWidth: 280,
  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
};
const inputStyle = {
  fontSize: 16,
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid var(--border-color)",
  width: "100%",
  outline: "none",
};
const btnStyle = {
  background: "var(--button-bg)",
  color: "var(--button-text)",
  border: "none",
  borderRadius: 6,
  padding: "10px 0",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};
const errorStyle = {
  color: "crimson",
  fontSize: 15,
  fontWeight: 500,
  marginBottom: 4,
};
const switchModeStyle = {
  background: "transparent",
  color: "var(--text-primary)",
  border: "none",
  marginTop: 8,
  cursor: "pointer",
  fontSize: 14,
  textDecoration: "underline",
};

/**
 * Dialog/modal component for create/edit note
 */
function NoteModal({ open, note, onClose, onSave, loading }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(note?.title || "");
      setContent(note?.content || "");
      setError("");
    }
  }, [open, note]);

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    try {
      await onSave({ title, content });
      onClose();
    } catch (e) {
      setError(e?.detail || "Failed to save note.");
    }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" style={modalOverlayStyle}>
      <div className="modal" style={modalStyle}>
        <form onSubmit={handleSubmit}>
          <h3>{note ? "Edit Note" : "New Note"}</h3>
          <input
            style={inputStyle}
            type="text"
            placeholder="Title"
            autoFocus
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit" }}
            placeholder="Content"
            value={content}
            maxLength={2048}
            onChange={(e) => setContent(e.target.value)}
          />
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button className="btn" style={btnStyle} type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              className="btn btn-secondary"
              style={{ ...btnStyle, background: "#bbb", color: "#111" }}
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
const modalOverlayStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.25)",
  zIndex: 99,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalStyle = {
  background: "var(--bg-secondary)",
  padding: "2rem 1.5rem",
  borderRadius: 12,
  minWidth: 320,
  maxWidth: 400,
  boxShadow: "0 4px 24px 0 rgba(0,0,0,0.20)",
};

/**
 * Notes List (card or list view)
 */
function NotesList({ notes, onEdit, onDelete, searchStr }) {
  if (!notes || !notes.length)
    return (
      <div style={{ textAlign: "center", color: "#888", marginTop: 32 }}>
        No notes found.
      </div>
    );
  return (
    <div
      className="notes-list"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        justifyContent: "center",
        marginTop: 8,
        marginBottom: 36,
      }}
    >
      {notes.map((note) => (
        <div
          className="note-card"
          key={note.id}
          style={{
            background: "var(--bg-secondary)",
            borderRadius: 10,
            boxShadow: "0 2px 10px 0 rgba(0,0,0,0.07)",
            border: "1px solid var(--border-color)",
            padding: "1.25rem 1rem",
            minWidth: 230,
            maxWidth: 280,
            flex: "1 1 240px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: "0 0 0.5rem 0",
                fontWeight: 700,
                color:
                  searchStr && note.title?.toLowerCase().includes(searchStr.toLowerCase())
                    ? "#1976d2"
                    : "var(--text-primary)",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                fontSize: 18,
              }}
              title={note.title}
            >
              {note.title}
            </h4>
            <p
              style={{
                color: "var(--text-primary)",
                opacity: 0.84,
                margin: "0 0 0.5rem 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
                minHeight: 45,
                fontSize: 15,
              }}
              title={note.content}
            >
              {note.content}
            </p>
            <span style={{ fontSize: 11, color: "#777" }}>
              Updated: {new Date(note.updated_at || note.created_at).toLocaleString()}
            </span>
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-small"
              title="Edit"
              style={{ background: "#1976d2", color: "#fff", padding: "6px 12px" }}
              onClick={() => onEdit(note)}
            >
              ✏️ Edit
            </button>
            <button
              className="btn btn-small"
              title="Delete"
              style={{
                background: "#e53935",
                color: "#fff",
                padding: "6px 12px",
              }}
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this note?")) onDelete(note);
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Notes dashboard page
 */
function NotesDashboard({ user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStr, setFilterStr] = useState("");
  const [searchStr, setSearchStr] = useState("");
  const [error, setError] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0); // Used to trigger reloads

  // Fetch notes on mount and when refreshFlag changes
  useEffect(() => {
    setLoading(true);
    setError("");
    apiRequest("/notes/")
      .then((data) => {
        setNotes(data || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.detail || "Could not load notes");
        setLoading(false);
      });
  }, [refreshFlag]);

  // PUBLIC_INTERFACE
  function openCreateModal() {
    setModalNote(null);
    setModalOpen(true);
  }
  // PUBLIC_INTERFACE
  function openEditModal(note) {
    setModalNote(note);
    setModalOpen(true);
  }
  // PUBLIC_INTERFACE
  async function handleDelete(note) {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/notes/${note.id}/`, "DELETE");
      setRefreshFlag(v => v + 1);
    } catch (e) {
      setError(e?.detail || "Failed to delete note");
    }
    setLoading(false);
  }
  // PUBLIC_INTERFACE
  async function handleSaveNote(fields) {
    setLoading(true);
    setError("");
    try {
      if (modalNote) {
        // Edit
        await apiRequest(`/notes/${modalNote.id}/`, "PUT", fields);
      } else {
        // Create
        await apiRequest("/notes/", "POST", fields);
      }
      setModalOpen(false);
      setRefreshFlag(v => v + 1);
    } catch (e) {
      setError(e?.detail || "Failed to save note");
      throw e;
    }
    setLoading(false);
  }

  // Filter and search notes
  let displayedNotes = notes;
  if (filterStr.trim()) {
    displayedNotes = displayedNotes.filter((n) =>
      n.title.toLowerCase().includes(filterStr.toLowerCase()) ||
      n.content.toLowerCase().includes(filterStr.toLowerCase())
    );
  } else if (searchStr.trim()) {
    displayedNotes = displayedNotes.filter((n) =>
      n.title.toLowerCase().includes(searchStr.toLowerCase())
    );
  }

  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearchStr(e.target.value);
    setFilterStr("");
  }
  // PUBLIC_INTERFACE
  function handleFilterChange(e) {
    setFilterStr(e.target.value);
    setSearchStr("");
  }

  // Responsive Card/List View Toggle (advanced)
  // Omitted for simplicity: always cards; can add toggle if desired

  return (
    <main style={dashboardStyle}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "space-between", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchStr}
          style={{ ...inputStyle, width: 210, fontSize: 15 }}
          onChange={handleSearchChange}
        />
        <input
          type="text"
          placeholder="Filter (title or content)..."
          value={filterStr}
          style={{ ...inputStyle, width: 210, fontSize: 15 }}
          onChange={handleFilterChange}
        />
        <button
          className="btn"
          style={{ ...btnStyle, marginLeft: "auto", minWidth: 120 }}
          onClick={openCreateModal}
        >
          ＋ New Note
        </button>
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={{ color: "#1976d2" }}>Loading...</div>}
      <NotesList
        notes={displayedNotes}
        onEdit={openEditModal}
        onDelete={handleDelete}
        searchStr={searchStr}
      />
      <NoteModal
        open={modalOpen}
        note={modalNote}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveNote}
        loading={loading}
      />
    </main>
  );
}
const dashboardStyle = {
  padding: "2rem 1rem",
  maxWidth: 950,
  margin: "0 auto",
  minHeight: "86vh",
};

/**
 * Main App entry point
 */
function App() {
  // Theme state
  const [theme, setTheme] = useState("light");
  // Auth/user state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // On mount, restore theme and try restoring user from token
  useEffect(() => {
    const localTheme = localStorage.getItem("theme");
    setTheme(localTheme === "dark" ? "dark" : "light");
    // Try loading user from JWT (minimal, assumes backend returns username in /me)
    const token = getToken();
    if (token) {
      apiRequest("/users/me/")
        .then((data) => setUser(data))
        .catch(() => {
          clearToken();
          setUser(null);
        });
    }
  }, []);

  // Update document theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  function handleThemeToggle() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  // PUBLIC_INTERFACE
  async function handleAuth({ username, password, mode }) {
    setAuthLoading(true);
    if (mode === "login") {
      const data = await apiRequest("/auth/login", "POST", { username, password });
      setToken(data.access_token);
      // Fetch user profile
      const userData = await apiRequest("/users/me/");
      setUser(userData);
    } else {
      // register
      await apiRequest("/auth/register", "POST", { username, password });
      // Automatically log in after registering
      const data = await apiRequest("/auth/login", "POST", { username, password });
      setToken(data.access_token);
      const userData = await apiRequest("/users/me/");
      setUser(userData);
    }
    setAuthLoading(false);
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    setUser(null);
    clearToken();
  }

  return (
    <div className="App">
      <Navbar
        onThemeToggle={handleThemeToggle}
        theme={theme}
        user={user}
        onLogout={handleLogout}
      />
      <div>
        {user ? (
          <NotesDashboard user={user} onLogout={handleLogout} />
        ) : (
          <AuthForm onAuth={handleAuth} loading={authLoading} />
        )}
      </div>
    </div>
  );
}

export default App;
