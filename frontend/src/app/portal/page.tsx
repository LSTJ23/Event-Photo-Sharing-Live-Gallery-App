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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("attendee");
  const [loading, setLoading] = useState(false);

  const loginRoles = [
    { label: "Attendee", value: "attendee" },
    { label: "Organizer", value: "organizer" },
    { label: "System Admin", value: "admin" }
  ];

  const registerRoles = [
    { label: "Organizer", value: "organizer" }
  ];

  const handleAuth = (e: React.FormEvent, targetView: string) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView(targetView);
    }, 1200);
  };

  const handleOpenLogin = () => {
    setRole("attendee");
    setName("");
    setEmail("");
    setView("login");
  };

  const handleOpenRegister = () => {
    setRole("organizer");
    setName("");
    setEmail("");
    setView("register");
  };

  if (view === "home") {
    return (
      <main className="glass-container">
        <div className="glass-card" style={{ maxWidth: '640px' }}>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Event Portal</h1>
          <p className="stagger-2">Access the live event gallery and connect instantly.</p>
          <div className="stagger-3 button-group">
            <button onClick={handleOpenLogin} className="btn-primary" style={{ width: '100%' }}>
              Enter Portal
            </button>
            <button 
              onClick={handleOpenRegister} 
              className="btn-primary" 
              style={{ width: '100%', backgroundColor: '#ffffff', color: '#000000' }}
            >
              EO Registration
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (view === "login") {
    return (
      <div className="glass-container">
        <div className="glass-card">
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Access</h1>
          <p className="stagger-1">Enter your details to securely access the event.</p>
          <form className="form-layout stagger-2" onSubmit={(e) => handleAuth(e, role)}>
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
                placeholder="juana.sarmiento.ebardaloza@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Logging in as</label>
              <CustomDropdown 
                options={loginRoles} 
                value={role} 
                onChange={setRole} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Authenticating..." : "Enter"}
            </button>
          </form>
          <p className="text-center mt-4 stagger-3" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            New Event Organizer? <button type="button" onClick={handleOpenRegister} className="text-link">Register Here</button>
          </p>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="glass-container">
        <div className="glass-card">
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">EO Register</h1>
          <p className="stagger-1">Sign up as an Event Organizer to create and manage galleries.</p>
          <form className="form-layout stagger-2" onSubmit={(e) => handleAuth(e, role)}>
            <div className="input-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                type="text"
                id="reg-name"
                className="input-field"
                placeholder="Juana Sarmiento Ebardaloza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                type="email"
                id="reg-email"
                className="input-field"
                placeholder="juana.sarmiento.ebardaloza@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Registering as</label>
              <CustomDropdown 
                options={registerRoles} 
                value={role} 
                onChange={setRole} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>
          <p className="text-center mt-4 stagger-3" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Already an Organizer? <button type="button" onClick={handleOpenLogin} className="text-link">Log in</button>
          </p>
        </div>
      </div>
    );
  }

  if (view === "admin") {
    return (
      <div className="glass-container">
        <div className="glass-card" style={{ maxWidth: "600px" }}>
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Admin</h1>
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
            <div className="button-group">
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Update Settings</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === "organizer") {
    return (
      <div className="glass-container">
        <div className="glass-card" style={{ maxWidth: "600px" }}>
          <button className="close-btn" onClick={() => setView("home")}>
            <CloseIcon />
          </button>
          <div className="app-title stagger-1">Event Photo Sharing</div>
          <h1 className="stagger-1">Setup</h1>
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
            <div className="button-group">
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Event</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-container">
      <div className="glass-card" style={{ maxWidth: "600px" }}>
        <button className="close-btn" onClick={() => setView("home")}>
          <CloseIcon />
        </button>
        <div className="app-title stagger-1">Event Photo Sharing</div>
        <h1 className="stagger-1">Gallery</h1>
        <p className="stagger-1">Upload your favorite photos to the shared timeline.</p>
        <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Caption</label>
            <input type="text" className="input-field" placeholder="Having a great time!" />
          </div>
          <div className="input-group">
            <label>Select Photo</label>
            <div className="upload-area">
              <span style={{ color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Tap or drag image here</span>
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Share Photo</button>
          </div>
        </form>
      </div>
    </div>
  );
}