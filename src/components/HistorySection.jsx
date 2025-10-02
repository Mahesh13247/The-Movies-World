import React, { useEffect, useMemo, useState } from "react";

const readHistory = () => {
  try {
    const raw = localStorage.getItem("movieLists");
    const lists = raw ? JSON.parse(raw) : [];
    const history = lists.find((l) => (l?.name || "").toLowerCase() === "history");
    return Array.isArray(history?.movies) ? history.movies : [];
  } catch (e) {
    return [];
  }
};

const writeHistory = (movies) => {
  try {
    const raw = localStorage.getItem("movieLists");
    const lists = raw ? JSON.parse(raw) : [];
    const idx = lists.findIndex((l) => (l?.name || "").toLowerCase() === "history");
    if (idx === -1) {
      lists.push({ name: "History", movies, favorite: false, createdAt: Date.now() });
    } else {
      lists[idx] = { ...lists[idx], movies };
    }
    localStorage.setItem("movieLists", JSON.stringify(lists));
  } catch (e) {
    // ignore
  }
};

const formatDayBucket = (iso) => {
  if (!iso) return "Older";
  const d = new Date(iso);
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.setHours(0,0,0,0) - new Date(d.setHours(0,0,0,0))) / oneDay);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Older";
};

export default function HistorySection({ t, watchMovie }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  const [history, setHistory] = useState(() => readHistory());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "movieLists") {
        setHistory(readHistory());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = history
      .slice() // copy
      .sort((a, b) => new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0));
    return q ? base.filter((m) => (m?.title || "").toLowerCase().includes(q)) : base;
  }, [history, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.slice(0, limit).forEach((m) => {
      const key = formatDayBucket(m.watchedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return Array.from(map.entries());
  }, [filtered, limit]);

  const handleClearAll = () => {
    writeHistory([]);
    setHistory([]);
  };

  const handleRemove = (idxInAll) => {
    const base = filtered; // already sorted
    const target = base[idxInAll];
    const newAll = history.filter((m) => m !== target);
    writeHistory(newAll);
    setHistory(newAll);
  };

  const handlePlay = (m) => {
    watchMovie(m.id, m.title, m.release_date || null);
  };

  if (!history || history.length === 0) return null;

  return (
    <section className="history-section" aria-label={t ? t("watch_history") : "Watch history"}>
      <div className="history-header">
        <h3>📜 {t ? t("watch_history") : "Watch history"}</h3>
        <div className="history-controls">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t ? t("search_placeholder") : "Search"}
            aria-label="Filter history"
          />
          <button onClick={() => setLimit((n) => (n >= 200 ? 24 : Math.min(200, n + 24)))}>
            {limit >= Math.min(200, filtered.length) ? (t ? t("show_less") : "Show less") : (t ? t("show_more") : "Show more")}
          </button>
          <button className="danger" onClick={handleClearAll} aria-label="Clear history">{t ? t("clear") : "Clear"}</button>
        </div>
      </div>

      {grouped.map(([bucket, items]) => (
        <div key={bucket} className="history-group">
          <div className="history-group-title">{bucket}</div>
          <div className="history-grid">
            {items.map((m, i) => (
              <div key={`${m.id}-${m.watchedAt}-${i}`} className="history-card">
                <button className="history-remove" title="Remove" aria-label="Remove" onClick={() => handleRemove(i)}>
                  ×
                </button>
                {m.poster_path ? (
                  <img
                    className="history-thumb-img"
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    onClick={() => handlePlay(m)}
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/64x64?text=No+Img";
                    }}
                  />
                ) : (
                  <div className="history-thumb" onClick={() => handlePlay(m)} role="button" tabIndex={0}>
                    <div className="thumb-initial">{(m.title || "?").slice(0, 1)}</div>
                  </div>
                )}
                <div className="history-meta">
                  <div className="history-title" title={m.title}>{m.title}</div>
                  <div className="history-sub">
                    {(m.release_date || "").slice(0, 10)} • {new Date(m.watchedAt).toLocaleString()}
                  </div>
                  <button className="play-again" onClick={() => handlePlay(m)} aria-label="Play again">▶ Play</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}


