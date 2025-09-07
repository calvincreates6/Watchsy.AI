import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams, useParams, useNavigate } from "react-router-dom";
import "../styles/Homepage.css";
import Header from "./subcomps/Header";
import Content from "./subcomps/Content";
import Footer from "./subcomps/Footer";

function Homepage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { query: queryParam } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const isHero = !searchQuery.trim();

  // Handle search from /?search= param (legacy)
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
      // Keep param for shareability; do not clear
    }
  }, [searchParams]);

  // Handle SEO route /search/:query
  useEffect(() => {
    if (typeof queryParam === 'string' && queryParam.length > 0) {
      // decode dash-separated slug back to text
      const decoded = decodeURIComponent(queryParam.replace(/\+/g, ' '));
      setSearchQuery(decoded);
    }
  }, [queryParam]);

  // When user searches from header, update SEO URL
  const handleHeaderSearch = (q) => {
    const cleaned = (q || '').trim();
    setSearchQuery(cleaned);
    if (cleaned) {
      const slug = encodeURIComponent(cleaned.replace(/\s+/g, '+'));
      navigate(`/search/${slug}`);
    } else {
      navigate(`/`);
    }
  };

  return (
    <div style={styles.container}>
      <Header onSearch={handleHeaderSearch} transparent={isHero} />
      <Content searchQuery={searchQuery} />
      <Footer />
    </div>
  );
}

const styles = {
  container: {
    margin: 0,
    padding: 0,
  },
};

export default Homepage;
