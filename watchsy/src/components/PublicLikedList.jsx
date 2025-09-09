import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './subcomps/Header';
import Footer from './subcomps/Footer';
import posterFiller from '../assets/posterFiller.jpg';
import './SharePage.css';
import { db } from '../firebaseConfig';
import { collection, getDocs, query as fsQuery, limit as fsLimit } from 'firebase/firestore';
import { resolvePublicLink, getPrivacySettings } from '../services/database';

export default function PublicLikedList(){
  const { slug } = useParams();
  const [ownerId, setOwnerId] = useState(null);
  const [privacy, setPrivacy] = useState({ watchlist: 'private', liked: 'private', watched: 'private' });
  const [liked, setLiked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await resolvePublicLink(slug);
        if (!res.success) { setError('Link not found'); setLoading(false); return; }
        const { userId } = res.data || {};
        setOwnerId(userId);
        const priv = await getPrivacySettings({ uid: userId });
        setPrivacy({ watchlist: 'public', liked: 'public', watched: 'public', ...(priv.data || {}) });
        const lkRef = collection(db, 'users', userId, 'liked');
        const lkSnap = await getDocs(fsQuery(lkRef, fsLimit(200)));
        setLiked(lkSnap.docs.map(d => d.data()));
      } catch (e) {
        setError('Failed to load shared list');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const canSeeLiked = privacy.liked !== 'private';

  if (loading) return (<><Header onSearch={() => {}} /><div className="share-content"><h2 style={{color:'#fff'}}>Loading...</h2></div><Footer/></>);
  if (error) return (<><Header onSearch={() => {}} /><div className="share-content"><h2 style={{color:'#fff'}}>{error}</h2></div><Footer/></>);

  return (
    <div className="share-container">
      <Header onSearch={() => {}} />
      <div className="share-content">
        <h1 className="content-title" style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>Shared Liked</h1>
        {canSeeLiked ? (
          <div className="share-previewRow">
            {liked.length === 0 ? <div className="share-noPreview">No items yet</div> : liked.map((m, i) => (
              <img height={400} width={500} key={m.id || i} src={m.poster || posterFiller} alt={m.title || 'Poster'} className="share-poster" onError={(e) => { e.currentTarget.src = posterFiller; }} />
            ))}
          </div>
        ) : (
          <div className="share-noPreview">This list is private</div>
        )}
      </div>
      <Footer />
    </div>
  );
} 