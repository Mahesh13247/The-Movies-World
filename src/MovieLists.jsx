import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function MovieLists() {
  const { t } = useTranslation();
  const [lists, setLists] = useState(() =>
    JSON.parse(localStorage.getItem("movieLists") || "[]")
  );
  const [newList, setNewList] = useState("");
  const [renamingIndex, setRenamingIndex] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const addList = () => {
    if (!newList.trim()) return;
    if (
      lists.some((l) => l.name.toLowerCase() === newList.trim().toLowerCase())
    ) {
      alert("List name already exists!");
      return;
    }
    const updated = [...lists, { name: newList.trim(), movies: [] }];
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
      alert("List name already exists!");
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
    const updated = lists.map((l, i) =>
      i === index ? { ...l, movies: [...l.movies, movie] } : l
    );
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

  return (
    <div className="movie-lists">
      <h2>{t("movie_lists")}</h2>
      <input
        value={newList}
        onChange={(e) => setNewList(e.target.value)}
        placeholder="New list name"
        onKeyDown={(e) => {
          if (e.key === "Enter") addList();
        }}
        aria-label="New list name"
      />
      <button onClick={addList} disabled={!newList.trim()}>
        Add List
      </button>
      <ul>
        {lists.length === 0 ? (
          <li>No lists yet.</li>
        ) : (
          lists.map((l, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
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
                  <button
                    onClick={() => {
                      renameList(i, renameValue);
                      setRenamingIndex(null);
                    }}
                  >
                    Save
                  </button>
                  <button onClick={() => setRenamingIndex(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 600 }}>{l.name}</span> (
                  {l.movies.length} movies)
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      setRenamingIndex(i);
                      setRenameValue(l.name);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    style={{ marginLeft: 4 }}
                    onClick={() => removeList(i)}
                  >
                    Delete
                  </button>
                </>
              )}
              {/* Movies in this list */}
              {l.movies.length > 0 && (
                <ul style={{ marginTop: 4, marginLeft: 16 }}>
                  {l.movies.map((m, mi) => (
                    <li key={mi}>
                      {typeof m === "string"
                        ? m
                        : m.title || m.name || "Untitled"}
                      <button
                        style={{ marginLeft: 6 }}
                        onClick={() => removeMovieFromList(i, mi)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {/* Add movie to list (demo input) */}
              <div style={{ marginTop: 4 }}>
                <input
                  placeholder="Add movie (title)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      addMovieToList(i, e.target.value.trim());
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default MovieLists;
