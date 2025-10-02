import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';

function MovieLists() {
  const { t } = useTranslation();
  const [lists, setLists] = useState(() =>
    JSON.parse(localStorage.getItem("movieLists") || "[]")
  );
  const [newList, setNewList] = useState("");
  const [renamingIndex, setRenamingIndex] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [filterText, setFilterText] = useState("");
  const [listSort, setListSort] = useState("favoritesFirst"); // favoritesFirst | nameAsc | nameDesc | sizeDesc
  const [movieSort, setMovieSort] = useState("added"); // added | titleAsc | titleDesc
  const fileInputRef = useRef(null);

  const addList = () => {
    if (!newList.trim()) return;
    if (
      lists.some((l) => l.name.toLowerCase() === newList.trim().toLowerCase())
    ) {
      toast.error("List name already exists!");
      return;
    }
    const updated = [...lists, { name: newList.trim(), movies: [], favorite: false, createdAt: Date.now() }];
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
    setNewList("");
  };

  // Remove a list
  const removeList = (index) => {
    const updated = lists.filter((_, i) => i !== index);
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Rename a list
  const renameList = (index, newName) => {
    if (!newName.trim()) return;
    if (
      lists.some(
        (l, i) =>
          i !== index && l.name.toLowerCase() === newName.trim().toLowerCase()
      )
    ) {
      toast.error("List name already exists!");
      return;
    }
    const updated = lists.map((l, i) =>
      i === index ? { ...l, name: newName.trim() } : l
    );
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Add a movie to a list
  const addMovieToList = (index, movie) => {
    const asTitle = typeof movie === 'string' ? movie : (movie?.title || movie?.name || '').toString();
    if (!asTitle.trim()) {
      toast.error("Please provide a movie title");
      return;
    }
    const updated = lists.map((l, i) => {
      if (i !== index) return l;
      const exists = l.movies.some((m) => {
        const mt = typeof m === 'string' ? m : (m?.title || m?.name || '');
        return mt.trim().toLowerCase() === asTitle.trim().toLowerCase();
      });
      if (exists) {
        toast.info("Movie already in list");
        return l;
      }
      return { ...l, movies: [...l.movies, movie] };
    });
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Remove a movie from a list
  const removeMovieFromList = (listIndex, movieIndex) => {
    const updated = lists.map((l, i) =>
      i === listIndex
        ? { ...l, movies: l.movies.filter((_, mi) => mi !== movieIndex) }
        : l
    );
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Clear all movies from a list
  const clearList = (index) => {
    const updated = lists.map((l, i) => i === index ? { ...l, movies: [] } : l);
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Duplicate a list
  const duplicateList = (index) => {
    const base = lists[index];
    if (!base) return;
    let name = `${base.name} Copy`;
    const names = new Set(lists.map(l => l.name.toLowerCase()));
    let suffix = 2;
    while (names.has(name.toLowerCase())) {
      name = `${base.name} Copy ${suffix++}`;
    }
    const updated = [...lists, { ...base, name, favorite: false, createdAt: Date.now() }];
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Toggle favorite on a list
  const toggleFavorite = (index) => {
    const updated = lists.map((l, i) => i === index ? { ...l, favorite: !l.favorite } : l);
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Change order of a movie inside a list
  const moveMovie = (listIndex, movieIndex, direction) => {
    const target = lists[listIndex];
    if (!target) return;
    const newIndex = movieIndex + direction;
    if (newIndex < 0 || newIndex >= target.movies.length) return;
    const newMovies = [...target.movies];
    const [m] = newMovies.splice(movieIndex, 1);
    newMovies.splice(newIndex, 0, m);
    const updated = lists.map((l, i) => i === listIndex ? { ...l, movies: newMovies } : l);
    setLists(updated);
    localStorage.setItem("movieLists", JSON.stringify(updated));
  };

  // Export all lists to JSON
  const exportLists = () => {
    const blob = new Blob([JSON.stringify(lists, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movieLists.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import lists from JSON
  const importLists = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      const sanitized = data.map((l) => ({
        name: (l?.name || '').toString().trim() || 'Untitled',
        movies: Array.isArray(l?.movies) ? l.movies : [],
        favorite: !!l?.favorite,
        createdAt: l?.createdAt || Date.now(),
      }));
      setLists(sanitized);
      localStorage.setItem("movieLists", JSON.stringify(sanitized));
      toast.success('Lists imported');
    } catch (e) {
      toast.error('Failed to import lists');
    }
  };

  const filteredAndSortedLists = useMemo(() => {
    const ft = filterText.trim().toLowerCase();
    let arr = lists.filter(l => !ft || l.name.toLowerCase().includes(ft));
    switch (listSort) {
      case 'nameAsc':
        arr.sort((a,b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        arr.sort((a,b) => b.name.localeCompare(a.name));
        break;
      case 'sizeDesc':
        arr.sort((a,b) => (b.movies?.length||0) - (a.movies?.length||0));
        break;
      case 'favoritesFirst':
      default:
        arr.sort((a,b) => (b.favorite === a.favorite) ? a.name.localeCompare(b.name) : (b.favorite ? 1 : -1));
        break;
    }
    return arr;
  }, [lists, filterText, listSort]);

  const sortMovies = (movies) => {
    if (movieSort === 'titleAsc') return [...movies].sort((a,b) => (getTitle(a)).localeCompare(getTitle(b)));
    if (movieSort === 'titleDesc') return [...movies].sort((a,b) => (getTitle(b)).localeCompare(getTitle(a)));
    return movies; // added order
  };

  const getTitle = (m) => (typeof m === 'string' ? m : (m?.title || m?.name || ''));

  return (
    <section className="movie-lists-section">
      <div className="ml-header">
        <h2 className="ml-title">🎞️ {t("movie_lists")}</h2>
      </div>
      {/* Controls */}
      <div className="ml-controls">
        <input
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
          placeholder="New list name"
          onKeyDown={(e) => {
            if (e.key === "Enter") addList();
          }}
          aria-label="New list name"
        />
        <button className="ml-btn primary" onClick={addList} disabled={!newList.trim()}>
          Add List
        </button>
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter lists"
          aria-label="Filter lists"
        />
        <select className="ml-select" value={listSort} onChange={(e) => setListSort(e.target.value)} aria-label="Sort lists">
          <option value="favoritesFirst">Favorites first</option>
          <option value="nameAsc">Name A–Z</option>
          <option value="nameDesc">Name Z–A</option>
          <option value="sizeDesc">Most movies</option>
        </select>
        <select className="ml-select" value={movieSort} onChange={(e) => setMovieSort(e.target.value)} aria-label="Sort movies in a list">
          <option value="added">By added order</option>
          <option value="titleAsc">Title A–Z</option>
          <option value="titleDesc">Title Z–A</option>
        </select>
        <button className="ml-btn" onClick={exportLists}>Export</button>
        <button className="ml-btn" onClick={() => fileInputRef.current?.click()}>Import</button>
        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importLists(file);
          e.target.value = '';
        }} />
      </div>
      <ul className="ml-lists">
        {filteredAndSortedLists.length === 0 ? (
          <li className="ml-empty">No lists yet.</li>
        ) : (
          filteredAndSortedLists.map((l, i) => (
            <li key={i} className="ml-card">
              {renamingIndex === i ? (
                <>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => {
                      renameList(i, renameValue);
                      setRenamingIndex(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameList(i, renameValue);
                        setRenamingIndex(null);
                      }
                    }}
                    autoFocus
                  />
                  <button className="ml-btn primary"
                    onClick={() => {
                      renameList(i, renameValue);
                      setRenamingIndex(null);
                    }}
                  >
                    Save
                  </button>
                  <button className="ml-btn" onClick={() => setRenamingIndex(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="ml-card-title">
                    <span className="ml-name">{l.name}</span>
                    <span className="ml-count">{l.movies.length} movies</span>
                  </div>
                  <div className="ml-actions">
                  <button className="ml-icon-btn"
                    onClick={() => toggleFavorite(lists.indexOf(l))}
                    aria-pressed={!!l.favorite}
                    title={l.favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    {l.favorite ? '★' : '☆'}
                  </button>
                  <button className="ml-btn"
                    onClick={() => {
                      setRenamingIndex(i);
                      setRenameValue(l.name);
                    }}
                  >
                    Rename
                  </button>
                  <button className="ml-btn danger"
                    onClick={() => removeList(lists.indexOf(l))}
                  >
                    Delete
                  </button>
                  <button className="ml-btn"
                    onClick={() => duplicateList(lists.indexOf(l))}
                  >
                    Duplicate
                  </button>
                  <button className="ml-btn"
                    onClick={() => clearList(lists.indexOf(l))}
                  >
                    Clear Movies
                  </button>
                  </div>
                </>
              )}
              {/* Movies in this list */}
              {l.movies.length > 0 && (
                <ul className="ml-movies">
                  {sortMovies(l.movies).map((m, mi) => (
                    <li key={mi} className="ml-movie-chip">
                      {typeof m === "string"
                        ? m
                        : m.title || m.name || "Untitled"}
                      <button
                        className="ml-icon-btn"
                        onClick={() => moveMovie(lists.indexOf(l), mi, -1)}
                        aria-label="Move up"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="ml-icon-btn"
                        onClick={() => moveMovie(lists.indexOf(l), mi, 1)}
                        aria-label="Move down"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className="ml-icon-btn danger"
                        onClick={() => removeMovieFromList(lists.indexOf(l), mi)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {/* Add movie to list (demo input) */}
              <div className="ml-add">
                <input
                  placeholder="Add movie (title)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      addMovieToList(lists.indexOf(l), e.target.value.trim());
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export default MovieLists;
