import React, { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

function Header({ onSearch, transparent = false }) {
  const [query, setQuery] = useState("");

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
          onClick={() => {
            window.location.href = "/";
          }}
        >
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
              y="45"
              fill="url(#textGradient)"
              fontFamily="Orbitron, Arial, sans-serif"
              fontSize="28"
              fontWeight="900"
              className="logo-text"
            >
              Watchsy
            </text>
            <text
              x="80"
              y="60"
              fill="#f5f6fa"
              fontFamily="Righteous, Arial, sans-serif"
              fontSize="12"
              letterSpacing="1"
              className="brand-tagline"
            >
              track what you watch
            </text>
            <text
              x="80"
              y="72"
              fill="#f5f6fa"
              fontFamily="Righteous, Arial, sans-serif"
              fontSize="12"
              letterSpacing="1"
              className="brand-tagline"
            >
              share what you love!
            </text>
          </svg>
        </div>

        {/* Search Bar */}
        <div className="flex-grow-1 d-flex justify-content-center">
          <form className="w-100" style={{ maxWidth: "600px", display: "flex", alignItems: "center" }} onSubmit={handleSearchClick}>
            <input
              id="my-search-bar"
              type="search"
              className="form-control form-input"
              placeholder="Search for movies, series..."
              aria-label="Search for movies and TV shows"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                backgroundColor: "#181c24",
                color: "#f5f6fa",
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
              Search
            </button>
          </form>
        </div>

        {/* Profile */}
        <div style={{ paddingRight: "0px", marginLeft: "auto" }}>
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
