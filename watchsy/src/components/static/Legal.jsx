import React from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function Legal(){
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #181c24 0%, #232b3b 100%)' }}>
      <Header onSearch={() => {}} />
      <main style={{ maxWidth: 900, margin:'0 auto', padding:'40px 20px', color:'#e6edf6' }}>
        <h1 className="content-title" style={{ marginBottom: 12 }}>Legal</h1>

        <section id="terms" style={{ marginTop: 20 }}>
          <h2 className="content-title">Terms of Service</h2>
          <p className="content-body" style={{ opacity:0.9 }}>
            By using Watchsy, you agree to use the service only for lawful purposes and to respect intellectual property rights. We may update features and policies over time. If we need to suspend accounts for abuse, spam, or fraud, we will do so to protect the community.
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>Accounts are personal; do not share credentials.</li>
            <li>Do not attempt to scrape, attack, or overload our services.</li>
            <li>Content and data you create remain yours; you grant us permission to store and process it to operate the app.</li>
          </ul>
        </section>

        <section id="privacy" style={{ marginTop: 32 }}>
          <h2 className="content-title">Privacy Policy</h2>
          <p className="content-body" style={{ opacity:0.9 }}>
            We collect the minimum data necessary to run Watchsy: account details, your lists, and usage needed to improve recommendations. Your lists are private by default—you choose what to share via link or public options. We never sell personal data.
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>You can export or delete your data by contacting support.</li>
            <li>We use cookies/auth tokens to keep you signed in securely.</li>
            <li>Third‑party APIs (like TMDB) are used for posters and metadata.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
} 