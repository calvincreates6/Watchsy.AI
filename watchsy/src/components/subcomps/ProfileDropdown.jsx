import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth"; // ⬅️ import Firebase signOut
import { auth } from "../../firebaseConfig"; // ⬅️ import your Firebase auth instance
import Image from "../../assets/watchsy.jpg";
import "./ProfileDropdown.css";
import movieClapperboard from "../../assets/movie clapperboard.png";
import heart from "../../assets/heart.png";
import castAndCrew from "../../assets/cast and crew.png";
import clock from "../../assets/watchlater clock.png";
import home from "../../assets/home.png";
import checklist from "../../assets/checklist.png";
import blueBird from "../../assets/blue bird.png";

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();
  const buttonRef = useRef();
  const [dropdownStyle, setDropdownStyle] = useState({});
  const navigate = useNavigate();

  // Logout with Firebase
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      navigate("/login"); // Redirect to login page
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
        <a href="/watchlist" tabIndex={0} role="menuitem">
          <img src={checklist} alt="Watchlist" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          Watchlist
        </a>
      </li>
      <li>
        <a href="/likedlist" tabIndex={0} role="menuitem">
          <img src={heart} alt="Liked" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
          Liked Movies
        </a>
      </li>
      <li>
        <a href="#" tabIndex={0} role="menuitem" onClick={handleShare}>
          <img src={blueBird} alt="Share" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
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
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      <img
        src={Image}
        alt="Profile"
        className="profile-image"
        tabIndex={-1}
        aria-hidden="true"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate("/profile")}
      />

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
    </div>
  );
}

export default ProfileDropdown;
