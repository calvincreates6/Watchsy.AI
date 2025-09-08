import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth"; // ⬅️ import Firebase signOut
import { auth } from "../../firebaseConfig"; // ⬅️ import your Firebase auth instance
import { useAuthState } from "react-firebase-hooks/auth";
import Image from "../../assets/watchsy.jpg";
import "./ProfileDropdown.css";
import heart from "../../assets/heart.png";
import castAndCrew from "../../assets/cast and crew.png";
import home from "../../assets/home.png";
import checklist from "../../assets/checklist.png";
import ConfirmModal from "../ConfirmModal";
import { deriveSlug } from "../../utils/slug";
import ai from "../../assets/ai.png";

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();
  const buttonRef = useRef();
  const [dropdownStyle, setDropdownStyle] = useState({});
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      if (user?.uid) {
        const s = await deriveSlug(user.uid);
        if (active) setSlug(s);
      } else {
        setSlug('me');
      }
    })();
    return () => { active = false; };
  }, [user]);

  // Logout with Firebase
  const handleLogout = async () => {
    try {
      setConfirmOpen(true);
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  const handleShare = () => {
    // navigator.clipboard.writeText("https://www.watchsy.com");
    alert("Sharing Feature Coming Soon!");
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Focus first item when open
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstLink = dropdownRef.current.querySelector("a, button");
      if (firstLink) firstLink.focus();
    }
  }, [isOpen]);

  // Positioning
  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 220;
      const padding = 8;
      let left = rect.right - menuWidth;
      const maxLeft = window.innerWidth - menuWidth - 8;
      if (left > maxLeft) left = maxLeft;
      if (left < 8) left = 8;
      const top = rect.bottom + window.scrollY + padding;
      setDropdownStyle({
        position: "absolute",
        top: `${top}px`,
        left: `${left + window.scrollX}px`,
        zIndex: 10000,
        width: 200,
      });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const dropdownMenu = (
    <ul
      className="custom-dropdown"
      ref={dropdownRef}
      role="menu"
      aria-label="Profile options"
      style={dropdownStyle}
    >
      <li>
        <a href="/" tabIndex={0} role="menuitem">
          <img src={home} alt="Home" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          Home
        </a>
      </li>
      <li>
        <a href="/ai" tabIndex={0} role="menuitem">
          <img src={ai} alt="AI" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          AI
        </a>
      </li>
      <li>
        <a href={`/${slug}/watchlist`} tabIndex={0} role="menuitem">
          <img src={checklist} alt="Watchlist" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          Watchlist
        </a>
      </li>
      <li>
        <a href={`/${slug}/likedlist`} tabIndex={0} role="menuitem">
          <img src={heart} alt="Liked" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          Liked Movies
        </a>
      </li>
      <li>
        <a href="/share" tabIndex={0} role="menuitem">
          <img src={castAndCrew} alt="Share" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          Share with Friends
        </a>
      </li>
      <li>
        <button 
          onClick={handleLogout} 
          className="logout-btn" 
          role="menuitem"
        >
          Logout
        </button>
      </li>
    </ul>
  );

  return (
    <div
      className="profile-dropdown-container"
      style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
    >
      <a href="/profile" draggable={true}>
      <img
        src={user?.photoURL || Image}
        alt="Profile"
        className="profile-image"
        tabIndex={-1}
        aria-hidden="true"
        style={{ cursor: 'pointer', borderRadius: '50%', border: '2.5px solid #ffd93d' }}
        onClick={() => navigate("/profile")}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.dataset.fallbackApplied === 'true') return;
          e.currentTarget.dataset.fallbackApplied = 'true';
          e.currentTarget.src = Image;
        }}
        />
      </a>

      <button
        className={`dropdown-arrow-btn${isOpen ? ' open' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close profile menu' : 'Open profile menu'}
        onClick={() => setIsOpen((prev) => !prev)}
        ref={buttonRef}
        style={{
          borderRadius: '50%',
          height: '30px',
          width: '30px',
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dropdown-arrow-icon"
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M6 8L10 12L14 8"
            stroke="#ffd93d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && ReactDOM.createPortal(dropdownMenu, document.body)}
      <ConfirmModal
        open={confirmOpen}
        title="Sign out?"
        description="You'll be returned to the login screen."
        confirmText="Sign out"
        cancelText="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          try {
            await signOut(auth);
            navigate("/login");
          } catch (e) {}
        }}
      />
    </div>
  );
}

export default ProfileDropdown;
