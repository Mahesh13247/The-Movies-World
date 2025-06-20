import React, { useState } from "react";
import "./AnimatedBackground.css";
import { useTranslation } from "react-i18next";

function AnimatedBackground() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="animated-bg-panel">
      <h2>{t("animated_background")}</h2>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => {
            setEnabled((v) => !v);
            document.body.classList.toggle("animated-bg", !enabled);
          }}
        />{" "}
        Enable Animated Background
      </label>
    </div>
  );
}

export default AnimatedBackground;
