import React from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function About(){
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #181c24 0%, #232b3b 100%)' }}>
      <Header onSearch={() => {}} />
      <main style={{ maxWidth: 900, margin:'0 auto', padding:'40px 20px', color:'#e6edf6' }}>
        <h1 className="content-title" style={{ marginBottom: 12 }}>About Watchsy</h1>
        <p className="content-body" style={{ opacity:0.9 }}>
          Watchsy helps movie lovers discover what to watch next, organize their personal lists, and share favorites with friends. Our AI builds smart suggestions from the films you like, then pairs them with trailers, cast, and where to watch.
        </p>
        <h2 className="content-title" style={{ marginTop: 28 }}>What we believe</h2>
        <ul style={{ lineHeight:1.8 }}>
          <li>Recommendations should feel personal and transparent.</li>
          <li>Your lists belong to you. You control privacy and sharing.</li>
          <li>Great UX comes from speed, clarity, and delightful details.</li>
        </ul>
        <h2 className="content-title" style={{ marginTop: 28 }}>Built for the community</h2>
        <p className="content-body" style={{ opacity:0.9 }}>
          We’re building Watchsy in the open. Feedback is always welcome—tell us what features you want next.
        </p>
      </main>
      <Footer />
    </div>
  );
} 