import React, { useState, useEffect } from "react";
import ProfileDropdown from "./ProfileDropdown";
import search from "../../assets/search.png";
import AI from "./AI";

function Header({ onSearch, transparent = false }) {
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch(query);
    }
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const headerStyle = transparent
    ? { padding: "10px 0", background: "transparent", position: "sticky", top: 0, zIndex: 10, backdropFilter: "saturate(120%) blur(8px)" }
    : { padding: "10px 0", background: "#181c24", transition: "background 0.3s", position: "sticky", top: 0, zIndex: 10 };

  const searchContainerStyle = {
    flexGrow: isMobile ? "0" : "1",
    display: "flex",
    justifyContent: "center",
    width: isMobile ? "100%" : "auto"
  };

  const searchFormStyle = {
    width: "100%",
    maxWidth: isMobile ? "100%" : "600px",
    display: "flex",
    alignItems: "center"
  };

  return (
    <header className="" style={headerStyle}>
      <div
        className="container d-flex flex-row align-items-center justify-content-between"
        style={{ minHeight: "80px", padding: "0 1rem" }}
      >
        {/* SVG */}
        <div
          className="d-flex align-items-center"
          style={{ minWidth: "240px", cursor: "pointer" }}
          draggable="true"
        >
          <a href="/" tabIndex={0} role="logo">
          {/* SVG goes here */}
          <svg
            width="250"
            height="80"
            viewBox="0 8 300 80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="filmGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "#6a11cb", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#2575fc", stopOpacity: 1 }}
                />
              </linearGradient>
              <linearGradient
                id="textGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "#6a11cb", stopOpacity: 1 }}
                />
                <stop
                  offset="50%"
                  style={{ stopColor: "#ff6b6b", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#ffd93d", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>
            <rect
              x="20"
              y="25"
              width="50"
              height="45"
              rx="8"
              ry="8"
              fill="url(#filmGradient)"
            />
            {[34, 42, 50, 58].map((cy, i) => (
              <>
                <circle
                  key={`l${i}`}
                  cx="26"
                  cy={cy}
                  r="3"
                  fill="rgba(0,0,0,0.3)"
                />
                <circle
                  key={`r${i}`}
                  cx="64"
                  cy={cy}
                  r="3"
                  fill="rgba(0,0,0,0.3)"
                />
              </>
            ))}
            <g transform="translate(50, 5) scale(1.2)">
              <path
                d="M15 15 C15 10, 10 5, 5 10 C0 15, 7 25, 15 30 C23 25, 30 15, 25 10 C20 5, 15 10, 15 15 Z"
                fill="#ff4757"
              />
              <polygon
                points="15,13 16.5,17 20,17 17,19.5 18.5,23 15,21 11.5,23 13,19.5 10,17 13.5,17"
                fill="white"
              />
            </g>
            <text
              x="80"
              y="62"
              fill="url(#textGradient)"
              fontFamily="Orbitron, Arial, sans-serif"
              fontSize="42"
              fontWeight="900"
              className="logo-text"
            >
              Watchsy
            </text>
          </svg>
          </a>
        </div>

        {/* Search Bar */}
        <div className="flex-grow-1 d-flex justify-content-center" style={searchContainerStyle}>
          <form className="w-100" style={searchFormStyle} onSubmit={handleSearchClick}>
            <input
              id="my-search-bar"
              type="search"
              className="form-control form-input"
              aria-label="Search for movies and TV shows"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                backgroundColor: "#181c24",
                color: "white",
                border: "1px solid gold",
                borderRadius: "25px",
                padding: "10px 20px",
                fontSize: "16px",
                flex: 1
              }}
            />
            <button
            className="search-button"
              type="submit"
            >
              <img src={search} alt="Search" style={{ width: "25px", height: "25px", marginRight: "6px" }} />
              Search
            </button>
            <div style={{ marginLeft: '8px' }}>
              <AI />
            </div>
          </form>
        </div>

        {/* Actions: Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}

const Styles = {
  image: {
    borderRadius: "50%",
    objectFit: "cover",
  },
  hcont: {
    gap: "20px",
    flexDirection: "row",
  },
};

export default Header;
