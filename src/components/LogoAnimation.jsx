import React, { useEffect, useState } from "react";
import "./LogoAnimation.css";

const LogoAnimation = ({ onAnimationComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 4000); // Duration for futuristic animations

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className="logo-animation-container">
      <div className="holographic-grid" />
      <div className="logo-animation">
        <div className="energy-ring" />
        <div className="holographic-lines" />
        <div className="energy-particles">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
        <div className="logo-content">
          <div className="logo-text">MOVIE FINDER</div>
          <div className="subtitle-text">K MAHESH KUMAR ACHARY 🌟</div>
        </div>
      </div>
    </div>
  );
};

export default LogoAnimation;
