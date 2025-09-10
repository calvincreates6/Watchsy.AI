import React from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function About() {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #181c24 0%, #232b3b 100%)' }}>
      <Header onSearch={() => {}} />
      <main style={{ maxWidth: 900, margin:'0 auto', padding:'40px 20px', color:'#e6edf6' }}>
        
        <h1 className="content-title" style={{ marginBottom: 12 }}>About Watchsy</h1>
        <p className="content-body" style={{ opacity:0.9 }}>
          Watchsy is your personal movie companion. We help film enthusiasts discover hidden gems, 
          decide what to watch next, and connect with a community that shares the same passion for cinema. 
          Our AI-powered recommendations are tailored to your taste, while also keeping you updated with 
          trailers, cast details, and where to watch—all in one place.
        </p>

        <h2 className="content-title" style={{ marginTop: 28 }}>Our Mission</h2>
        <p className="content-body" style={{ opacity:0.9 }}>
          We believe movie discovery should feel effortless and exciting. Whether you’re hunting for the 
          next blockbuster, revisiting a classic, or exploring an underrated indie, Watchsy makes sure 
          you never run out of great options.
        </p>

        <h2 className="content-title" style={{ marginTop: 28 }}>What We Stand For</h2>
        <ul style={{ lineHeight:1.8 }}>
          <li><strong>Personalized Experience:</strong> Recommendations designed just for you, not one-size-fits-all.</li>
          <li><strong>Control & Privacy:</strong> Your lists and favorites belong to you—you decide what’s public or private.</li>
          <li><strong>Community Driven:</strong> Movies are better shared. Connect, recommend, and discover together.</li>
          <li><strong>Simplicity & Speed:</strong> Clean design, quick navigation, and details that make browsing enjoyable.</li>
        </ul>

        <h2 className="content-title" style={{ marginTop: 28 }}>Built With You in Mind</h2>
        <p className="content-body" style={{ opacity:0.9 }}>
          Watchsy is constantly evolving. We build in the open and love hearing from our users. 
          Have an idea, feature request, or just want to share your favorite film? 
          Reach out—we’re building this platform together, for the community.
        </p>
      </main>
      <Footer />
    </div>
  );
}
