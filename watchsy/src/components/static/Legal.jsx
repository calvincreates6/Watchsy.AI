import React from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function Legal() {
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #181c24 0%, #232b3b 100%)' }}>
      <Header onSearch={() => {}} />
      <main style={{ maxWidth: 900, margin:'0 auto', padding:'40px 20px', color:'#e6edf6' }}>
        
        <h1 className="content-title" style={{ marginBottom: 12 }}>Legal</h1>

        {/* Terms of Service */}
        <section id="terms" style={{ marginTop: 20 }}>
          <h2 className="content-title">Terms of Service</h2>
          <p className="content-body" style={{ opacity:0.9 }}>
            By accessing or using Watchsy, you agree to abide by the following terms. 
            These terms are designed to protect both our users and the platform so everyone 
            can enjoy a safe, fair, and enjoyable experience.
          </p>
          <ul style={{ lineHeight: 1.8, marginTop: 12 }}>
            <li>Accounts are for individual use only—please do not share your login credentials.</li>
            <li>Do not attempt to hack, overload, or interfere with Watchsy’s services or data.</li>
            <li>All content and data you create remain yours. By using Watchsy, you grant us permission to securely store and process it in order to provide our services.</li>
            <li>We reserve the right to suspend accounts engaged in abuse, spam, or fraudulent activity to protect the community.</li>
            <li>Features and policies may evolve over time; continued use of Watchsy means you accept those updates.</li>
          </ul>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" style={{ marginTop: 32 }}>
          <h2 className="content-title">Privacy Policy</h2>
          <p className="content-body" style={{ opacity:0.9 }}>
            Your privacy matters to us. Watchsy only collects the minimum data required to 
            deliver personalized recommendations and keep your account secure. 
            We never sell your personal information.
          </p>
          <ul style={{ lineHeight: 1.8, marginTop: 12 }}>
            <li>Your lists are private by default. You choose if and when to share them.</li>
            <li>We collect basic account details (like your email) and usage data to improve recommendations.</li>
            <li>Cookies and authentication tokens are used to keep you securely signed in.</li>
            <li>Third-party APIs (such as TMDB) are used to provide posters, trailers, and metadata.</li>
            <li>You may request to export or delete your data at any time by contacting support.</li>
          </ul>
          <p className="content-body" style={{ opacity:0.9, marginTop: 12 }}>
            If you have questions about how your data is handled, 
            please reach out—we’re committed to transparency and protecting your privacy.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
}
