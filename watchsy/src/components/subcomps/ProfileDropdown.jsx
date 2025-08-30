import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import ProfileImage from "../../assets/Website_Name_Color.jpg";
import "./ProfileDropdown.css";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();
  const buttonRef = useRef();
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) setIsOpen(false);
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

  // Focus first link when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstLink = dropdownRef.current.querySelector("a");
      firstLink?.focus();
    }
  }, [isOpen]);

  // Compute absolute position
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 200;
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
        width: `${menuWidth}px`,
        zIndex: 10000,
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
        <a href="#" role="menuitem">
          Home
        </a>
      </li>
      <li>
        <a href="#" role="menuitem">
          Saved List
        </a>
      </li>
      <li>
        <a href="#" role="menuitem">
          Liked Movies
        </a>
      </li>
      <li>
        <a href="#" role="menuitem">
          Logout
        </a>
      </li>
    </ul>
  );

  return (
    <div className="profile-dropdown-container">
      <img src={ProfileImage} alt="Profile" className="profile-image" />
      <button
        ref={buttonRef}
        className={`dropdown-arrow-btn ${isOpen ? "open" : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close profile menu" : "Open profile menu"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dropdown-arrow-icon"
        >
          <path
            d="M6 8L10 12L14 8"
            stroke="#ffd93d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 0.25s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </svg>
      </button>

      {isOpen && ReactDOM.createPortal(dropdownMenu, document.body)}
    </div>
  );
}
