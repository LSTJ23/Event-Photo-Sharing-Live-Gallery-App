"use client";

import { useState, useRef, useEffect } from "react";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={`chevron ${open ? "open" : ""}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface CustomDropdownProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

const CustomDropdown = ({ options, value, onChange }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedLabel = options.find(opt => opt.value === value)?.label || "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <div 
        className={`dropdown-header ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <ChevronIcon open={isOpen} />
      </div>
      {isOpen && (
        <div className="dropdown-list">
          {options.map((option) => (
            <div
              key={option.value}
              className="dropdown-item"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AppPortal() {
  const [view, setView] = useState("home");
  
  // States for forms
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("organizer"); 
  const [loading, setLoading] = useState(false);

  const managementRoles = [
    { label: "Event Organizer", value: "organizer" },
    { label: "System Admin", value: "admin" }
  ];

  const handleAuth = (e: React.FormEvent, targetView: string) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView(targetView);
    }, 1200);
  };

  const handleOpenUserLogin = () => {
    setName("");
    setEmail("");
    setView("login_user");
  };

  const handleOpenAdminLogin = () => {
    setEmail("");
    setPassword("");
    setRole("organizer");
    setView("login_admin");
  };

  if (view === "home") {
    return (
      <main className="glass-container portal-theme">
        <div className="glass-card" style={{ maxWidth: '500px' }}>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Event Portal</h1>
          <p className="stagger-2">Access the live event gallery and connect instantly.</p>
          <div className="stagger-3 button-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={handleOpenUserLogin} className="btn-primary" style={{ width: '100%' }}>
              Participant Access
            </button>
            <button 
              onClick={handleOpenAdminLogin} 
              className="btn-primary" 
              style={{ width: '100%', backgroundColor: '#f5f5f5', color: '#000000', border: '1px solid #e0e0e0', boxShadow: 'none' }}
            >
              Organizer & Admin
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (view === "login_user") {
    return (
      <div className="glass-container portal-theme">
        <div className="glass-card">
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Join Gallery</h1>
          <p className="stagger-1">Enter your details to seamlessly enter the event.</p>
          <form className="form-layout stagger-2" onSubmit={(e) => handleAuth(e, "gallery")}>
            <div className="input-group">
              <label htmlFor="login-name">Full Name</label>
              <input
                type="text"
                id="login-name"
                className="input-field"
                placeholder="Juana Sarmiento Ebardaloza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                className="input-field"
                placeholder="juana.sarmiento@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? "Connecting..." : "Enter Portal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === "login_admin") {
    return (
      <div className="glass-container portal-theme">
        <div className="glass-card">
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Dashboard Access</h1>
          <p className="stagger-1">Log in securely to manage events and system settings.</p>
          <form className="form-layout stagger-2" onSubmit={(e) => handleAuth(e, role)}>
            <div className="input-group">
              <label htmlFor="admin-email">Email Address</label>
              <input
                type="email"
                id="admin-email"
                className="input-field"
                placeholder="admin@events.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="admin-password">Password</label>
              <input
                type="password"
                id="admin-password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Select Role</label>
              <CustomDropdown 
                options={managementRoles} 
                value={role} 
                onChange={setRole} 
              />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? "Authenticating..." : "Login to Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === "admin") {
    return (
      <div className="glass-container portal-theme">
        <div className="glass-card" style={{ maxWidth: "600px" }}>
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">System Admin</h1>
          <p className="stagger-1">Configure global server settings and maintenance.</p>
          <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label>Max Storage Limit (GB)</label>
              <input type="number" className="input-field" defaultValue={500} />
            </div>
            <div className="input-group">
              <label>Global Notification</label>
              <input type="text" className="input-field" placeholder="System maintenance..." />
            </div>
            <div className="button-group" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Update Settings</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === "organizer") {
    return (
      <div className="glass-container portal-theme">
        <div className="glass-card" style={{ maxWidth: "600px" }}>
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Event Setup</h1>
          <p className="stagger-1">Create a new live gallery and configure access.</p>
          <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label>Event Name</label>
              <input type="text" className="input-field" placeholder="Autumn Gala 2026" />
            </div>
            <div className="input-group">
              <label>Passcode (Optional)</label>
              <input type="password" className="input-field" placeholder="Leave blank for public" />
            </div>
            <div className="button-group" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Event</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Gallery View (Screen Fit Optimized)
  return (
    <div className="glass-container portal-theme" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button className="close-btn" onClick={() => setView("home")}>
          <CloseIcon />
        </button>
        <div className="app-title stagger-1">Event Photo Sharing</div>
        <h1 className="stagger-1">Live Gallery</h1>
        <p className="stagger-1">Upload your favorite photos to the shared timeline.</p>
        <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Caption</label>
            <input type="text" className="input-field" placeholder="Having a great time! ✨" />
          </div>
          <div className="input-group">
            <label>Select Photo</label>
            <div className="upload-area">
              <span style={{ color: '#888888', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Tap or drag image here</span>
            </div>
          </div>
          <div className="button-group" style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Share to Timeline</button>
          </div>
        </form>
      </div>
    </div>
  );
}
