import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import "../styles/Homepage.css";
import Header from "./subcomps/Header";
import Content from "./subcomps/Content";
import Footer from "./subcomps/Footer";

function Homepage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const person = location.state || null;
  const [searchQuery, setSearchQuery] = useState("");

  const isHero = !searchQuery.trim();

  // Handle search from URL parameters
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
      // Clear the URL parameter after setting the search
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <div style={styles.container}>
      <Header onSearch={setSearchQuery} transparent={isHero} />
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
