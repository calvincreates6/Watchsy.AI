import React from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function Contact(){
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #181c24 0%, #232b3b 100%)' }}>
      <Header onSearch={() => {}} />
      <main style={{ maxWidth: 900, margin:'0 auto', padding:'40px 20px', color:'#e6edf6' }}>
        <h1 className="content-title" style={{ marginBottom: 12 }}>Contact</h1>
        <p className="content-body" style={{ opacity:0.9 }}>Have a question, bug, or idea? Send us a note.</p>
        <form onSubmit={(e) => e.preventDefault()} style={{ display:'grid', gap:12, marginTop:16 }}>
          <input placeholder="Your email" required style={fieldStyle} />
          <input placeholder="Subject" required style={fieldStyle} />
          <textarea placeholder="Message" rows={5} required style={{ ...fieldStyle, resize:'vertical' }} />
          <button type="submit" style={btnStyle}>Send</button>
        </form>
        <p className="content-body" style={{ opacity:0.8, marginTop:12 }}>Or email us at support@watchsy.app</p>
      </main>
      <Footer />
    </div>
  );
}

const fieldStyle = {
  padding:'12px 14px', borderRadius:12, border:'1px solid #333a4d', background:'#0f1320', color:'#e6edf6'
};
const btnStyle = {
  padding:'12px 18px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:700,
  background:'linear-gradient(135deg, #ffd93d, #ff6b6b)', color:'#181c24'
}; 