import { useState, useEffect } from "react";
import API from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function Overview({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [datasetsRes, chatsRes] = await Promise.all([
          API.get("/my-datasets"),
          API.get("/my-chats")
        ]);
        const datasets = datasetsRes.data;
        const sessions = chatsRes.data;
        const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
        const questionsByDay = {};
        sessions.forEach(session => {
          session.messages.forEach(msg => {
            const day = new Date(msg.created_at).toLocaleDateString();
            questionsByDay[day] = (questionsByDay[day] || 0) + 1;
          });
        });
        const activityData = Object.entries(questionsByDay)
          .slice(-7)
          .map(([date, count]) => ({ date, questions: count }));
        setStats({ datasets: datasets.length, sessions: sessions.length, questions: totalMessages, activityData, recentSessions: sessions.slice(0, 5) });
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="overview-overlay">
      <div className="overview-panel">
        <div style={{textAlign:"center",padding:"40px",color:"#8e8ea0"}}>Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="overview-overlay" onClick={onClose}>
      <div className="overview-panel" onClick={e => e.stopPropagation()}>
        <div className="overview-header">
          <h3>Dashboard Overview</h3>
          <button className="settings-close" onClick={onClose}>&#10005;</button>
        </div>
        <div className="overview-body">
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-number">{stats.datasets}</p>
              <p className="stat-label">Datasets</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">{stats.sessions}</p>
              <p className="stat-label">Chat Sessions</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">{stats.questions}</p>
              <p className="stat-label">Questions Asked</p>
            </div>
          </div>
          <div className="overview-section">
            <p className="settings-section-label">Activity (last 7 days)</p>
            <div style={{background:"#1a1a1a",borderRadius:"10px",padding:"16px"}}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.activityData} margin={{top:5,right:10,left:-20,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:"#8e8ea0",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#8e8ea0",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:"#1e1e1e",border:"1px solid #3f3f3f",borderRadius:"8px",color:"#ececec",fontSize:"12px"}}/>
                  <Bar dataKey="questions" fill="#10a37f" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="overview-section">
            <p className="settings-section-label">Recent Chats</p>
            {stats.recentSessions.map(session => (
              <div key={session.session_id} className="overview-chat-item">
                <p className="chat-question">{session.title}</p>
                <p className="chat-date">{new Date(session.created_at).toLocaleDateString()} · {session.messages.length} msg</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
