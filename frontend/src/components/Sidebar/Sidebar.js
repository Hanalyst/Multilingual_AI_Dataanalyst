import { useState, useEffect, useCallback, useRef } from "react";
import UploadDataset from "../Dataset/UploadDataset";
import DatasetList from "../Dataset/DatasetList";
import Settings from "./Settings";
import API from "../../services/api";

function ChatMenuItem({ session, activeChatId, onLoadSession, onNewChat, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openMenu = (e) => {
    e.stopPropagation();
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ 
      top: rect.bottom + window.scrollY + 4, 
      left: rect.left + window.scrollX - 110
    });
    setMenuOpen(prev => !prev);
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim()) { setRenaming(false); return; }
    await onRename(session.session_id, renameValue);
    setRenaming(false);
  };

  return (
    <div
      className={"chat-history-item" + (activeChatId === session.session_id ? " active-chat" : "")}
      onClick={() => !renaming && onLoadSession(session)}
    >
      {renaming ? (
        <input
          className="rename-input"
          value={renameValue}
          autoFocus
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setRenaming(false);
          }}
          onBlur={handleRenameSubmit}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div className="chat-item-row">
          <div className="chat-item-text">
            <p className="chat-question">{session.title}</p>
            <p className="chat-date">
              {new Date(session.created_at).toLocaleDateString()} &middot; {session.messages.length} msg
            </p>
          </div>
          <button ref={btnRef} className="chat-menu-btn" onClick={openMenu}>
            &#8942;
          </button>
        </div>
      )}

      {menuOpen && (
        <div
          ref={menuRef}
          className="chat-menu-dropdown"
          style={{ 
            position: "fixed",
            top: menuPos.top, 
            left: menuPos.left,
            zIndex: 9999
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="chat-menu-item"
            onClick={() => {
              setMenuOpen(false);
              setRenaming(true);
              setRenameValue(session.title);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Rename
          </button>
          <button
            className="chat-menu-item chat-menu-delete"
            onClick={(e) => {
              setMenuOpen(false);
              onDelete(e, session.session_id);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ onLoadSession, onNewChat, activeChatId, refreshTrigger, user, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await API.get("/my-chats");
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshTrigger]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      await API.delete("/my-chats/" + sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (activeChatId === sessionId) onNewChat();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleRename = async (sessionId, newTitle) => {
    try {
      await API.patch("/my-chats/" + sessionId + "/rename", { title: newTitle });
      setSessions(prev => prev.map(s =>
        s.session_id === sessionId ? { ...s, title: newTitle } : s
      ));
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const currentLang = localStorage.getItem("language") || "en";
  const langLabels = {
    en: "English", ta: "Tamil", hi: "Hindi", te: "Telugu",
    ml: "Malayalam", kn: "Kannada", ar: "Arabic", bn: "Bengali",
    gu: "Gujarati", pa: "Punjabi", fr: "French", de: "German",
    ja: "Japanese", zh: "Chinese"
  };

  return (
    <>
      {showSettings && (
        <Settings user={user} onLogout={onLogout} onClose={() => setShowSettings(false)} />
      )}

      <div className="mobile-navbar">
        <button className="menu-btn" onClick={() => setOpen(!open)}>&#9776;</button>
        <span style={{fontWeight: 700, fontSize: 16}}>Hanalyst</span>
      </div>

      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">Hanal<span>yst</span></div>

        <UploadDataset onUploadSuccess={fetchSessions} />
        <div className="section-divider" />
        <DatasetList />
        <div className="section-divider" />

        <button className="sidebar-btn new-chat-btn" onClick={onNewChat}>
          + New Chat
        </button>

        <div className="chat-history-section">
          <span className="section-label">Chat History</span>
          {sessions.length === 0 && (
            <p className="no-chats">No chats yet</p>
          )}
          {sessions.map(session => (
            <ChatMenuItem
              key={session.session_id}
              session={session}
              activeChatId={activeChatId}
              onLoadSession={onLoadSession}
              onNewChat={onNewChat}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="section-divider" />
          <button className="settings-trigger" onClick={() => setShowSettings(true)}>
            <div className="settings-trigger-left">
              <div className="settings-user-dot">
                {user ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="settings-trigger-info">
                <p className="settings-trigger-name">{user?.username || "User"}</p>
                <p className="settings-trigger-lang">{langLabels[currentLang] || "English"}</p>
              </div>
            </div>
            <span className="settings-gear">&#9881;</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
