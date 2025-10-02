import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function ThemeCustomizer() {
  const { t } = useTranslation();
  const [primary, setPrimary] = useState(
    localStorage.getItem("primaryColor") || "#ffcc00"
  );
  const [bg, setBg] = useState(localStorage.getItem("bgColor") || "#22223b");
  const handleApply = () => {
    document.documentElement.style.setProperty("--primary-color", primary);
    document.body.style.backgroundColor = bg;
    localStorage.setItem("primaryColor", primary);
    localStorage.setItem("bgColor", bg);
  };
  return (
    <div className="theme-customizer">
      <h2>{t("theme_customization")}</h2>
      <label>
        Primary Color:{" "}
        <input
          type="color"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
        />
      </label>
      <label>
        Background Color:{" "}
        <input
          type="color"
          value={bg}
          onChange={(e) => setBg(e.target.value)}
        />
      </label>
      <button onClick={handleApply}>Apply</button>
    </div>
  );
}

export default ThemeCustomizer;
