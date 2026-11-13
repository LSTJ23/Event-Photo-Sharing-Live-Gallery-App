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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("attendee");
  const [loading, setLoading] = useState(false);

  const loginRoles = [
    { label: "Attendee", value: "attendee" },
    { label: "Organizer", value: "organizer" },
    { label: "System Admin", value: "admin" }
  ];

  const registerRoles = [
    { label: "Attendee", value: "attendee" },
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
    setEmail("");
    setView("login");
  };

  const handleOpenRegister = () => {
    setRole("attendee");
    setEmail("");
    setView("register");
  };

  if (view === "home") {
    return (
      <main className="glass-container">
        <div className="glass-card" style={{ maxWidth: '640px' }}>
          <h1 className="stagger-1">Event Photo Sharing</h1>
          <p className="stagger-2">Curate and share beautiful memories in real-time. Join the live aesthetic gallery to get started.</p>
          <div className="stagger-3 button-group">
            <button onClick={handleOpenLogin} className="btn-primary">
              Log In
            </button>
            <button onClick={handleOpenRegister} className="btn-primary btn-secondary">
              Register
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
          <h1 className="stagger-1">Welcome Back</h1>
          <p className="stagger-1">Enter your email to receive a secure login link. No password needed.</p>
          <form className="form-layout stagger-2" onSubmit={(e) => handleAuth(e, role)}>
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                className="input-field"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Logging in as...</label>
              <CustomDropdown 
                options={loginRoles} 
                value={role} 
                onChange={setRole} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verifying..." : "Send Login Link"}
            </button>
          </form>
          <p className="text-center mt-4 stagger-3" style={{ fontSize: "0.875rem" }}>
            Don't have an account? <button onClick={handleOpenRegister} className="text-link">Sign up</button>
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
          <h1 className="stagger-1">Join the Event</h1>
          <p className="stagger-1">Sign up instantly with just your email to access the live gallery.</p>
          <form className="form-layout stagger-2" onSubmit={(e) => handleAuth(e, role)}>
            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                type="email"
                id="reg-email"
                className="input-field"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>I am joining as an...</label>
              <CustomDropdown 
                options={registerRoles} 
                value={role} 
                onChange={setRole} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending Magic Link..." : "Continue"}
            </button>
          </form>
          <p className="text-center mt-4 stagger-3" style={{ fontSize: "0.875rem" }}>
            Already have an account? <button onClick={handleOpenLogin} className="text-link">Log in</button>
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
          <h1 className="stagger-1">Admin Configuration</h1>
          <p className="stagger-1">Configure global server settings and maintenance.</p>
          <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label>Max Storage Limit (GB)</label>
              <input type="number" className="input-field" defaultValue={500} />
            </div>
            <div className="input-group">
              <label>Global Notification Message</label>
              <input type="text" className="input-field" placeholder="System maintenance at midnight..." />
            </div>
            <div className="button-group">
              <button type="submit" className="btn-primary">Update System Settings</button>
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
          <h1 className="stagger-1">Event Setup</h1>
          <p className="stagger-1">Create a new live gallery and set attendee permissions.</p>
          <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label>Event Name</label>
              <input type="text" className="input-field" placeholder="Autumn Gala 2026" />
            </div>
            <div className="input-group">
              <label>Gallery Passcode (Optional)</label>
              <input type="password" className="input-field" placeholder="Leave blank for public" />
            </div>
            <div className="button-group">
              <button type="submit" className="btn-primary">Create Event Link</button>
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
        <h1 className="stagger-1">Capture the Moment</h1>
        <p className="stagger-1">Upload your favorite photos to the shared event timeline.</p>
        <form className="dashboard-form stagger-2" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Add a Caption</label>
            <input type="text" className="input-field" placeholder="Having a great time! ✨" />
          </div>
          <div className="input-group">
            <label>Select Photo</label>
            <div className="upload-area">
              <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Tap to browse or drag image here</span>
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="btn-primary">Share to Gallery</button>
          </div>
        </form>
      </div>
    </div>
  );
}
