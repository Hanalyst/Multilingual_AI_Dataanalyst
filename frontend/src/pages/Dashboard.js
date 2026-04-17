import { useState, useEffect } from "react";
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

  useEffect(() => {
    API.get("/me").then(res => setUser(res.data)).catch(() => {});
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
            <button
              className="overview-btn"
              onClick={() => setShowOverview(true)}
              title="Dashboard Overview"
            >
              Overview
            </button>
            {user && <span className="user-badge">{user.email}</span>}
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