import React from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function Contact() {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #181c24 0%, #232b3b 100%)' }}>
      <Header onSearch={() => {}} />
      <main style={{ maxWidth: 900, margin:'0 auto', padding:'40px 20px', color:'#e6edf6' }}>
        
        <h1 className="content-title" style={{ marginBottom: 12 }}>Get in Touch</h1>
        <p className="content-body" style={{ opacity:0.9 }}>
          Have feedback, found a bug, or want to suggest a feature?  
          We’d love to hear from you! Use the form below to send us a quick note, 
          and we’ll get back to you as soon as possible.
        </p>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const email = e.target[0].value;
            const subject = encodeURIComponent(e.target[1].value);
            const message = encodeURIComponent(e.target[2].value + `\n\nFrom: ${email}`);
            window.location.href = `mailto:calvin.creates6@gmail.com?subject=${subject}&body=${message}`;
          }}
          style={{ display:'grid', gap:12, marginTop:16 }}
        >
          <input placeholder="Your email" required style={fieldStyle} />
          <input placeholder="Subject" required style={fieldStyle} />
          <textarea placeholder="Message" rows={5} required style={{ ...fieldStyle, resize:'vertical' }} />
          <button type="submit" style={btnStyle}>Send Message</button>
        </form>

        <p className="content-body" style={{ opacity:0.8, marginTop:12 }}>
          Prefer email? Reach us directly at{" "}
          <a href="mailto:calvin.creates6@gmail.com" style={{ color:'#ffd93d', fontWeight:600 }}>
            calvin.creates6@gmail.com
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
}

const fieldStyle = {
  padding:'12px 14px',
  borderRadius:12,
  border:'1px solid #333a4d',
  background:'#0f1320',
  color:'#e6edf6',
  fontSize:'15px'
};

const btnStyle = {
  padding:'12px 18px',
  borderRadius:12,
  border:'none',
  cursor:'pointer',
  fontWeight:700,
  fontSize:'15px',
  background:'linear-gradient(135deg, #ffd93d, #ff6b6b)',
  color:'#181c24',
  transition:'all 0.3s ease'
};
