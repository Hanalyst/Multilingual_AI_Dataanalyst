import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "ta", label: "Tamil", native: "Tamil" },
  { code: "hi", label: "Hindi", native: "Hindi" },
  { code: "te", label: "Telugu", native: "Telugu" },
  { code: "ml", label: "Malayalam", native: "Malayalam" },
  { code: "kn", label: "Kannada", native: "Kannada" },
  { code: "bn", label: "Bengali", native: "Bengali" },
  { code: "gu", label: "Gujarati", native: "Gujarati" },
  { code: "pa", label: "Punjabi", native: "Punjabi" },
  { code: "ar", label: "Arabic", native: "Arabic" },
  { code: "fr", label: "French", native: "French" },
  { code: "de", label: "German", native: "German" },
  { code: "ja", label: "Japanese", native: "Japanese" },
  { code: "zh", label: "Chinese", native: "Chinese" }
];

function Settings({ user, onLogout, onClose }) {
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const [showLanguages, setShowLanguages] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (code) => {
    setLanguage(code);
    localStorage.setItem("language", code);
    setSaved(true);
    setShowLanguages(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>

        <div className="settings-header">
          <h3>Settings</h3>
          <button className="settings-close" onClick={onClose}>&#10005;</button>
        </div>

        <div className="settings-body">

          <div className="settings-profile-card">
            <div className="settings-avatar-lg">
              {user ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="settings-profile-info">
              <p className="settings-profile-name">{user?.username || "User"}</p>
              <p className="settings-profile-email">{user?.email || ""}</p>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-menu-list">

            <div
              className="settings-menu-item"
              onClick={() => setShowLanguages(!showLanguages)}
            >
              <div className="settings-menu-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Language</span>
              </div>
              <div className="settings-menu-right">
                <span className="settings-menu-value">{currentLang?.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showLanguages ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>

            {showLanguages && (
              <div className="settings-lang-dropdown">
                <div className="language-grid-2col">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      className={"lang-btn" + (language === lang.code ? " lang-active" : "")}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <span className="lang-name">{lang.label}</span>
                      {language === lang.code && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {saved && (
                  <div className="settings-saved">Language updated!</div>
                )}
              </div>
            )}

          </div>

          <div className="settings-divider" />

          <div className="settings-menu-list">
            <button className="settings-menu-item settings-logout" onClick={() => { if (window.confirm("Are you sure you want to sign out?")) onLogout(); }}>
              <div className="settings-menu-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Log out</span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;

