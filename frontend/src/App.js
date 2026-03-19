import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./styles/global.css";
import { DatasetProvider } from "./context/DatasetContext";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("dataset_id");
    setIsLoggedIn(false);
  };

  return (
    <DatasetProvider>
      {isLoggedIn
        ? <Dashboard onLogout={handleLogout} />
        : <Login onLogin={handleLogin} />
      }
    </DatasetProvider>
  );
}

export default App;
