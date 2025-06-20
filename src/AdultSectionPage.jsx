import React from "react";
import ExternalLinks from "./components/ExternalLinks";
import AdultSearchBar from "./components/AdultSearchBar.jsx";

export default function AdultSectionPage({ BASE_URL, API_KEY, t }) {
  return (
    <div className="adult-section">
      <h2>{t ? t("adult_section") : "Adult 18+ Section"}</h2>
      <AdultSearchBar BASE_URL={BASE_URL} API_KEY={API_KEY} t={t} />
      <ExternalLinks />
    </div>
  );
} 