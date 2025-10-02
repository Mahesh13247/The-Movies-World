import React from "react";
import ExternalLinks from "./components/ExternalLinks";
import AdultSearchBar from "./components/AdultSearchBar.jsx";
import "./components/AdultSection.css";

export default function AdultSectionPage({ BASE_URL, API_KEY, t }) {
  return (
    <div className="adult-section">
      <header className="adult-section-header">
        <h2 className="adult-section-title">
          {t ? t("adult_section") : "Adult 18+ Section"}
        </h2>
      </header>
      <AdultSearchBar BASE_URL={BASE_URL} API_KEY={API_KEY} t={t} />
      <ExternalLinks />
    </div>
  );
}