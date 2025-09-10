import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Header from './subcomps/Header';
import Footer from './subcomps/Footer';
import posterFiller from '../assets/posterFiller.jpg';
import './SharePage.css';
import { db } from '../firebaseConfig';
import { collection, getDocs, query as fsQuery, limit as fsLimit } from 'firebase/firestore';
import { resolvePublicLink, getPrivacySettings } from '../services/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { deriveListSlug } from '../utils/slug';

export default function PublicWatchlist(){
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const qp = (searchParams.get('tab') || '').toLowerCase();
  const [activeTab, setActiveTab] = useState(qp === 'watched' ? 'watched' : 'watchlist');
  const [ownerId, setOwnerId] = useState(null);
  const [privacy, setPrivacy] = useState({ watchlist: 'private', liked: 'private', watched: 'private' });
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewer] = useAuthState(auth);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      setWatchlist([]);
      setWatched([]);
      try {
        let res = await resolvePublicLink(slug);
        let userId = res.success ? (res.data || {}).userId : null;
        // Fallback: if viewer is the owner but mapping is missing (private mode), allow access
        if (!userId && viewer?.uid) {
          try {
            const mySlug = await deriveListSlug(viewer.uid, 'watchlist');
            if (mySlug === slug) userId = viewer.uid;
          } catch(_) {}
        }
        if (!userId) { setError('Link not found'); setLoading(false); return; }
        setOwnerId(userId);
        // privacy
        const priv = await getPrivacySettings({ uid: userId });
        const p = { watchlist: 'public', liked: 'public', watched: 'public', ...(priv.data || {}) };
        setPrivacy(p);
        const isOwner = !!viewer && viewer.uid === userId;
        const canSeeWatchlist = isOwner || p.watchlist !== 'private';
        const canSeeWatched = isOwner || p.watched !== 'private';
        // Conditionally fetch allowed lists only
        const tasks = [];
        if (canSeeWatchlist) {
          const wlRef = collection(db, 'users', userId, 'watchlist');
          tasks.push(getDocs(fsQuery(wlRef, fsLimit(200))).then(s => setWatchlist(s.docs.map(d => d.data()))).catch(() => setWatchlist([])));
        }
        if (canSeeWatched) {
          const wdRef = collection(db, 'users', userId, 'watched');
          tasks.push(getDocs(fsQuery(wdRef, fsLimit(200))).then(s => setWatched(s.docs.map(d => d.data()))).catch(() => setWatched([])));
        }
        await Promise.all(tasks);
      } catch (e) {
        setError('Failed to load shared list');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, viewer]);

  const isOwner = !!viewer && viewer.uid === ownerId;
  const canSeeWatchlist = isOwner || privacy.watchlist !== 'private';
  const canSeeWatched = isOwner || privacy.watched !== 'private';

  if (loading) return (<><Header onSearch={() => {}} /><div className="share-content"><h2 style={{color:'#fff'}}>Loading...</h2></div><Footer/></>);
  if (error) return (<><Header onSearch={() => {}} /><div className="share-content"><h2 style={{color:'#fff'}}>{error}</h2></div><Footer/></>);

  return (
    <div className="share-container">
      <Header onSearch={() => {}} />
      <div className="share-content" style={{ minHeight: '60vh' }}>
        <h1 className="content-title" style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>Shared Watchlist</h1>

        <div className="list-toggle" style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:16 }}>
          <button 
            className={`toggle-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
            disabled={!canSeeWatchlist}
          >Watch Later</button>
          <button 
            className={`toggle-btn ${activeTab === 'watched' ? 'active' : ''}`}
            onClick={() => setActiveTab('watched')}
            disabled={!canSeeWatched}
          >Watched</button>
        </div>

        {activeTab === 'watchlist' && (
          canSeeWatchlist ? (
            <div className="share-previewRow">
              {watchlist.length === 0 ? <div className="share-noPreview">No items yet</div> : watchlist.map((m, i) => (
                <img key={m.id || i} src={m.poster || posterFiller} alt={m.title || 'Poster'} className="share-poster" onError={(e) => { e.currentTarget.src = posterFiller; }} />
              ))}
            </div>
          ) : (
            <div className="share-noPreview" style={{color:'#fff', textAlign:'center', height:'50vh', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem'}}>This list is private</div>
          )
        )}

        {activeTab === 'watched' && (
          canSeeWatched ? (
            <div className="share-previewRow">
              {watched.length === 0 ? <div className="share-noPreview">No items yet</div> : watched.map((m, i) => (
                <img key={m.id || i} src={m.poster || posterFiller} alt={m.title || 'Poster'} className="share-poster" onError={(e) => { e.currentTarget.src = posterFiller; }} />
              ))}
            </div>
          ) : (
            <div className="share-noPreview" style={{color:'#fff', textAlign:'center', height:'50vh', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem'}}>This list is private</div>
          )
        )}
      </div>
      <Footer  />
    </div>
  );
} 