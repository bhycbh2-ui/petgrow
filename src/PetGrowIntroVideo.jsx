import React, { useEffect, useRef, useState } from 'react';

export default function PetGrowIntroVideo({ lang = 'ko' }) {
  const video = useRef(null);
  const [sound, setSound] = useState(false);
  const en = lang === 'en';
  useEffect(() => {
    if (!video.current) return;
    video.current.muted = true;
    video.current.volume = 0.5;
    video.current.play()?.catch(() => {});
  }, []);
  const toggleSound = () => {
    if (!video.current) return;
    video.current.muted = !video.current.muted;
    if (!video.current.muted) video.current.play()?.catch(() => {});
    setSound(!video.current.muted);
  };
  return <div className="petgrow-intro-player">
    <video ref={video} src="/intro-video.mp4" poster="/intro-video-poster.webp" autoPlay muted={!sound} loop playsInline controls preload="metadata" aria-label={en ? 'PetGrow introduction video' : '펫그로우 소개 영상'} onVolumeChange={() => { if (video.current) setSound(!video.current.muted); }} />
    <div className="petgrow-intro-sound"><span>{sound ? (en ? 'Sound is on' : '소리와 함께 재생 중') : (en ? 'Playing without sound' : '무음으로 재생 중')}</span><button type="button" onClick={toggleSound} aria-pressed={sound}>{sound ? (en ? 'Mute' : '무음으로 보기') : (en ? 'Play with sound' : '소리 켜고 재생')}</button></div>
  </div>;
}
