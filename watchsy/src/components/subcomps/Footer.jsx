import React from "react";

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.brandSection}>
          <div style={styles.logoRow}>
            <span style={styles.logoIcon}>🎬</span>
            <span style={styles.brand}>Watchsy</span>
          </div>
          <p style={styles.tagline}>Track what you watch. Share what you love.</p>
        </div>

        <div style={styles.linksSection}>
          <div style={styles.column}>
            <h4 style={styles.heading}>Product</h4>
            <a style={styles.link} href="#">Discover</a>
            <a style={styles.link} href="#">Watchlist</a>
            <a style={styles.link} href="#">Trending</a>
          </div>
          <div style={styles.column}>
            <h4 style={styles.heading}>Company</h4>
            <a style={styles.link} href="#">About</a>
            <a style={styles.link} href="#">Contact</a>
            <a style={styles.link} href="#">Careers</a>
          </div>
          <div style={styles.column}>
            <h4 style={styles.heading}>Resources</h4>
            <a style={styles.link} href="#">Help Center</a>
            <a style={styles.link} href="#">Terms</a>
            <a style={styles.link} href="#">Privacy</a>
          </div>
        </div>

        <div style={styles.socialSection}>
          <h4 style={styles.heading}>Follow</h4>
          <div style={styles.socialRow}>
            <a style={styles.social} href="#" aria-label="Twitter">🐦</a>
            <a style={styles.social} href="#" aria-label="Instagram">📷</a>
            <a style={styles.social} href="#" aria-label="YouTube">▶️</a>
          </div>
        </div>
      </div>

      <div style={styles.bottomBar}>
        <span style={styles.small}>
          © {new Date().getFullYear()} Watchsy. All rights reserved.
        </span>
        <span style={styles.small}>Made with ❤️ for movie lovers.</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#141822",
    borderTop: "1px solid #333a4d",
    color: "#f5f6fa",
    paddingTop: 40,
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 20px",
    display: "grid",
    gridTemplateColumns: "1.4fr 2fr 1fr",
    gap: 24,
  },
  brandSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    fontSize: 24,
  },
  brand: {
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 0.4,
  },
  tagline: {
    color: "#b8c5d6",
    margin: 0,
  },
  linksSection: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  heading: {
    fontSize: 14,
    color: "#95a7bf",
    textTransform: "uppercase",
    letterSpacing: 1,
    margin: 0,
    marginBottom: 8,
  },
  link: {
    color: "#e6edf6",
    textDecoration: "none",
    fontSize: 15,
    opacity: 0.9,
  },
  socialSection: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-end",
  },
  socialRow: {
    display: "flex",
    gap: 12,
  },
  social: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    background: "#232b3b",
    border: "1px solid #333a4d",
    color: "#ffd93d",
    textDecoration: "none",
    fontSize: 18,
  },
  bottomBar: {
    borderTop: "1px solid #333a4d",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: 1200,
    margin: "0 auto",
    color: "#95a7bf",
    fontSize: 13,
  },
  small: {
    opacity: 0.9,
  },
};

export default Footer; 