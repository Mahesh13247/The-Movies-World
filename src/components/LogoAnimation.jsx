import React, { useEffect, useState } from "react";
import "./LogoAnimation.css";

const LogoAnimation = ({ onAnimationComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState('initial');

  useEffect(() => {
    // Phase 1: Initial fade in
    const phase1Timer = setTimeout(() => {
      setAnimationPhase('reveal');
    }, 500);

    // Phase 2: Main animation
    const phase2Timer = setTimeout(() => {
      setAnimationPhase('glow');
    }, 1500);

    // Phase 3: Final phase and exit
    const exitTimer = setTimeout(() => {
      setAnimationPhase('exit');
      setTimeout(() => {
        setIsVisible(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 800);
    }, 3500);

    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(exitTimer);
    };
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className={`netflix-logo-container ${animationPhase}`}>
      <div className="netflix-background">
        <div className="netflix-gradient-overlay"></div>
        <div className="netflix-particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`netflix-particle particle-${i + 1}`} />
          ))}
        </div>
      </div>
      
      <div className="netflix-logo-wrapper">
        <div className="netflix-logo-main">
          <div className="netflix-logo-text">
            <span className="letter-m">M</span>
            <span className="letter-o">O</span>
            <span className="letter-v">V</span>
            <span className="letter-i">I</span>
            <span className="letter-e">E</span>
            <span className="letter-space"> </span>
            <span className="letter-f">F</span>
            <span className="letter-i2">I</span>
            <span className="letter-n">N</span>
            <span className="letter-d">D</span>
            <span className="letter-e2">E</span>
            <span className="letter-r">R</span>
          </div>
          <div className="netflix-logo-glow"></div>
          <div className="netflix-logo-reflection"></div>
        </div>
        
        <div className="netflix-subtitle">
          <div className="subtitle-line"></div>
          <span className="subtitle-text">K MAHESH KUMAR ACHARY</span>
          <div className="subtitle-line"></div>
        </div>
      </div>
      
      <div className="netflix-sound-waves">
        <div className="sound-wave wave-1"></div>
        <div className="sound-wave wave-2"></div>
        <div className="sound-wave wave-3"></div>
      </div>
    </div>
  );
};

export default LogoAnimation;
