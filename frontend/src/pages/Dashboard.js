import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import Overview from "./Overview";
import API from "../services/api";

function Dashboard({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [user, setUser] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    API.get("/me").then(res => setUser(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLoadSession = (session) => {
    const allMessages = [];
    session.messages.forEach(msg => {
      allMessages.push({ role: "user", text: msg.question });
      allMessages.push({
        role: "assistant",
        sql: msg.sql_query,
        data: msg.result_data || [],
        insight: msg.insight,
        chart: msg.chart_data
      });
    });
    setMessages(allMessages);
    setSessionId(session.session_id);
    setActiveChatId(session.session_id);
    localStorage.setItem("dataset_id", session.dataset_id);
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setActiveChatId(null);
  };

  return (
    <div className="dashboard">
      {showOverview && <Overview onClose={() => setShowOverview(false)} />}
      <Sidebar
        onLoadSession={handleLoadSession}
        onNewChat={handleNewChat}
        activeChatId={activeChatId}
        refreshTrigger={refreshSidebar}
        user={user}
        onLogout={onLogout}
      />
      <div className="main-area">
        <div className="chat-header">
          <h2>Hanalyst</h2>
          <div className="header-right">
            <button className="overview-btn" onClick={() => setShowOverview(true)}>
              Overview
            </button>
            <div className="header-menu-wrap" ref={menuRef}>
              <button className="header-dots-btn" onClick={() => setShowMenu(p => !p)}>
                <span></span><span></span><span></span>
              </button>
              {showMenu && (
                <div className="header-dropdown">
                  <div className="header-dropdown-user">
                    <p className="header-dropdown-name">{user?.username || "User"}</p>
                    <p className="header-dropdown-email">{user?.email || ""}</p>
                  </div>
                  <div className="header-dropdown-divider"/>
                  <button className="header-dropdown-item" onClick={() => { setShowMenu(false); setShowOverview(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Overview
                  </button>
                  <div className="header-dropdown-divider"/>
                  <button className="header-dropdown-item header-dropdown-logout" onClick={() => { setShowMenu(false); if(window.confirm("Are you sure you want to sign out?")) onLogout(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <ChatWindow
          messages={messages}
          setMessages={setMessages}
          sessionId={sessionId}
          setSessionId={(sid) => {
            setSessionId(sid);
            setActiveChatId(sid);
            setRefreshSidebar(prev => prev + 1);
          }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
