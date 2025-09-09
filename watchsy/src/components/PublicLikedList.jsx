import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export default function PublicLikedList(){
  const { slug } = useParams();
  const [ownerId, setOwnerId] = useState(null);
  const [privacy, setPrivacy] = useState({ watchlist: 'private', liked: 'private', watched: 'private' });
  const [liked, setLiked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewer] = useAuthState(auth);

  useEffect(() => {
    (async () => {
      try {
        let res = await resolvePublicLink(slug);
        let userId = res.success ? (res.data || {}).userId : null;
        if (!userId && viewer?.uid) {
          try {
            const mySlug = await deriveListSlug(viewer.uid, 'liked');
            if (mySlug === slug) userId = viewer.uid;
          } catch(_) {}
        }
        if (!userId) { setError('Link not found'); setLoading(false); return; }
        setOwnerId(userId);
        const priv = await getPrivacySettings({ uid: userId });
        setPrivacy({ watchlist: 'public', liked: 'public', watched: 'public', ...(priv.data || {}) });
        const canSee = (!!viewer && viewer.uid === userId) || (priv.data || {}).liked !== 'private';
        if (canSee) {
          const lkRef = collection(db, 'users', userId, 'liked');
          const lkSnap = await getDocs(fsQuery(lkRef, fsLimit(200)));
          setLiked(lkSnap.docs.map(d => d.data()));
        } else {
          setLiked([]);
        }
      } catch (e) {
        setError('Failed to load shared list');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, viewer]);

  const canSeeLiked = (!!viewer && viewer.uid === ownerId) || privacy.liked !== 'private';

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
          <div className="share-noPreview" style={{color:'#fff', textAlign:'center', height:'60vh', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem'}}>This list is private</div>
        )}
      </div>
      <Footer />
    </div>
  );
} 