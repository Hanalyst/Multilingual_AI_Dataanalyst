import { useState } from "react";
import API from "../services/api";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await API.post("/register", {
          username: form.username,
          email: form.email,
          password: form.password
        });
        alert("Registered! Please login.");
        setIsRegister(false);
      } else {
        const formData = new URLSearchParams();
        formData.append("username", form.email);
        formData.append("password", form.password);
        const res = await API.post("/login", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        localStorage.setItem("token", res.data.access_token);
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Hanalyst</h2>
        <p className="login-subtitle">
          {isRegister ? "Create your account" : "Sign in to continue"}
        </p>
        {isRegister && (
          <input className="login-input" placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        )}
        <input className="login-input" placeholder="Email" type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input className="login-input" placeholder="Password" type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="login-error">{error}</p>}
        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>
        <p className="login-toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <span onClick={() => { setIsRegister(!isRegister); setForm({ username: "", email: "", password: "" }); setError(""); }}>
            {isRegister ? " Login" : " Register"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;

