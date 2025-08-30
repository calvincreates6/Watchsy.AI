import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/Homepage.css";
import Header from "./subcomps/Header";
import Content from "./subcomps/Content";
import Footer from "./subcomps/Footer";

function Homepage() {
  const location = useLocation();
  const person = location.state || null;
  const [searchQuery, setSearchQuery] = useState("");

  const isHero = !searchQuery.trim();

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
