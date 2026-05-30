import React, { useState } from 'react';

export default function ShareModal({ onClose }) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Dynamically determine the URL to share.
  // If we are on localhost/dev server, fallback to the production URL.
  const shareUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://6502.is'
    : window.location.href;

  const shareText = 'Check out 6502.is - an interactive 3D WebGL microprocessor simulation! Observe computing at its absolute core. 🕹️💡';

  const socialLinks = {
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage('Link copied to clipboard!');
      triggerToast();
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleTikTokShare = async () => {
    // Copy the pre-formatted text + link for easy pasting on TikTok
    try {
      const tiktokMessage = `${shareText} ${shareUrl}`;
      await navigator.clipboard.writeText(tiktokMessage);
      setToastMessage('Message & Link copied! Share on TikTok 🎵');
      triggerToast();
    } catch (err) {
      console.error('Failed to copy TikTok text: ', err);
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '6502.is 3D',
          text: 'WebGL 6502 Simulation - observe computing at its absolute core.',
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Web Share failed:', err);
        }
      }
    }
  };

  const isWebShareSupported = !!navigator.share;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close share dialog">&times;</button>
        <h2>Share 6502.is</h2>
        <p>
          Spread the word about the 3D WebGL 6502 Simulation! Invite others to observe computing at its absolute core.
        </p>

        <div className="share-grid">
          {/* X (formerly Twitter) */}
          <a
            href={socialLinks.x}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn-card share-x"
            title="Share on X"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>X</span>
          </a>

          {/* Reddit */}
          <a
            href={socialLinks.reddit}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn-card share-reddit"
            title="Share on Reddit"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.24-1.72l1.37-4.31 3.79.8c.09 1.07.98 1.93 2.07 1.93 1.15 0 2.1-0.95 2.1-2.1s-.95-2.1-2.1-2.1c-1.01 0-1.85.72-2.04 1.67l-4.22-.9c-.23-.05-.45.09-.51.32l-1.63 5.17c-2.46.08-4.74.72-6.4 1.73-.55-.74-1.44-1.2-2.39-1.2-1.65 0-3 1.35-3 3 0 1.12.63 2.1 1.56 2.62-.06.29-.1.59-.1.88 0 3.86 4.7 7 10.5 7s10.5-3.14 10.5-7c0-.29-.04-.59-.1-.88.93-.52 1.56-1.5 1.56-2.62zM7.5 13c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-1.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm10 4.5c-2.25 2.25-6.75 2.25-9 0-.2-.2-.2-.52 0-.72.2-.2.52-.2.72 0 1.76 1.76 5.8 1.76 7.56 0 .2-.2.52-.2.72 0 .2.2.2.52 0 .72zm-1.5-3c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-1.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/>
            </svg>
            <span>Reddit</span>
          </a>

          {/* LinkedIn */}
          <a
            href={socialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn-card share-linkedin"
            title="Share on LinkedIn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
            <span>LinkedIn</span>
          </a>

          {/* TikTok */}
          <button
            onClick={handleTikTokShare}
            className="share-btn-card share-tiktok"
            title="Copy TikTok Share Content"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.6 4.2 1.12 1.37 2.75 2.32 4.51 2.72v3.72c-1.62-.17-3.19-.88-4.4-1.99-.44-.41-.83-.87-1.15-1.37v6.62c.07 1.88-.47 3.76-1.56 5.25-1.57 2.16-4.13 3.49-6.8 3.51-2.91.03-5.74-1.42-7.23-3.92-1.74-2.93-1.49-6.85.64-9.52C3.5 7.6 5.86 6.5 8.39 6.45v3.7c-1.39.05-2.75.76-3.5 1.93-.97 1.51-.83 3.56.33 4.93 1.05 1.25 2.77 1.83 4.37 1.48 1.44-.32 2.61-1.49 2.9-2.94.1-.48.09-.98.09-1.47V.02z"/>
            </svg>
            <span>TikTok</span>
          </button>

          {/* Facebook */}
          <a
            href={socialLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn-card share-facebook"
            title="Share on Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
            </svg>
            <span>Facebook</span>
          </a>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="share-btn-card share-copy"
            title="Copy Link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>Copy Link</span>
          </button>

          {/* Web Share (If supported) */}
          {isWebShareSupported && (
            <button
              onClick={handleNativeShare}
              className="share-btn-card share-native"
              style={{ gridColumn: 'span 3' }}
              title="More Share Options"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                <span>Share via App...</span>
              </div>
            </button>
          )}
        </div>

        {/* Copy Notification Toast */}
        <div className={`copy-toast ${showToast ? 'show' : ''}`}>
          {toastMessage}
        </div>
      </div>
    </div>
  );
}
