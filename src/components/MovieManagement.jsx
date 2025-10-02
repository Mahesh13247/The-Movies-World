import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './MovieManagement.css';

/**
 * Enhanced Movie Management Component
 */
export const MovieManagement = ({ movies, onAddMovie, onEditMovie, onDeleteMovie, onBulkAction }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedMovies, setSelectedMovies] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // Get unique genres and years from movies
  const genres = useMemo(() => {
    const allGenres = new Set();
    movies.forEach(movie => {
      if (movie.genre) {
        movie.genre.split(',').forEach(g => allGenres.add(g.trim()));
      }
    });
    return Array.from(allGenres).sort();
  }, [movies]);

  const years = useMemo(() => {
    const allYears = new Set();
    movies.forEach(movie => {
      if (movie.year) allYears.add(movie.year);
    });
    return Array.from(allYears).sort((a, b) => b - a);
  }, [movies]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let filtered = movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (movie.genre && movie.genre.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGenre = selectedGenre === 'all' || 
                          (movie.genre && movie.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
      const matchesYear = selectedYear === 'all' || movie.year === parseInt(selectedYear);
      
      return matchesSearch && matchesGenre && matchesYear;
    });

    // Sort movies
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [movies, searchQuery, selectedGenre, selectedYear, sortBy, sortOrder]);

  // Handle movie selection
  const handleMovieSelect = (movieId, isSelected) => {
    const newSelected = new Set(selectedMovies);
    if (isSelected) {
      newSelected.add(movieId);
    } else {
      newSelected.delete(movieId);
    }
    setSelectedMovies(newSelected);
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedMovies(new Set(filteredMovies.map(m => m.id)));
    } else {
      setSelectedMovies(new Set());
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedMovies.size === 0) return;
    
    const selectedMovieIds = Array.from(selectedMovies);
    if (onBulkAction) {
      onBulkAction(action, selectedMovieIds);
    }
    setSelectedMovies(new Set());
  };

  return (
    <div className="movie-management">
      {/* Header with Search and Filters */}
      <div className="movie-management-header">
        <div className="search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder={t("search_movies")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t("all_genres")}</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t("all_years")}</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="sort-select"
          >
            <option value="title-asc">{t("title")} A-Z</option>
            <option value="title-desc">{t("title")} Z-A</option>
            <option value="year-desc">{t("year")} (Newest)</option>
            <option value="year-asc">{t("year")} (Oldest)</option>
            <option value="rating-desc">{t("rating")} (Highest)</option>
            <option value="rating-asc">{t("rating")} (Lowest)</option>
            <option value="views-desc">{t("views")} (Most)</option>
            <option value="views-asc">{t("views")} (Least)</option>
          </select>
        </div>
        
        <div className="view-controls">
          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
          
          <button 
            className="add-movie-btn"
            onClick={() => setShowAddModal(true)}
          >
            ➕ {t("add_new_movie")}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedMovies.size > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">
            {selectedMovies.size} {selectedMovies.size === 1 ? 'movie' : 'movies'} selected
          </span>
          <div className="bulk-buttons">
            <button 
              className="bulk-btn export"
              onClick={() => handleBulkAction('export')}
            >
              📤 Export
            </button>
            <button 
              className="bulk-btn edit"
              onClick={() => handleBulkAction('edit')}
            >
              ✏️ Edit
            </button>
            <button 
              className="bulk-btn delete"
              onClick={() => handleBulkAction('delete')}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {/* Movies Display */}
      <div className={`movies-container ${viewMode}`}>
        {viewMode === 'list' && (
          <div className="movies-list-header">
            <div className="select-column">
              <input
                type="checkbox"
                checked={selectedMovies.size === filteredMovies.length && filteredMovies.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </div>
            <div className="title-column">{t("title")}</div>
            <div className="genre-column">{t("genre")}</div>
            <div className="year-column">{t("year")}</div>
            <div className="rating-column">{t("rating")}</div>
            <div className="views-column">{t("views")}</div>
            <div className="actions-column">{t("actions")}</div>
          </div>
        )}
        
        <div className="movies-list">
          {filteredMovies.map(movie => (
            <MovieItem
              key={movie.id}
              movie={movie}
              viewMode={viewMode}
              isSelected={selectedMovies.has(movie.id)}
              onSelect={(isSelected) => handleMovieSelect(movie.id, isSelected)}
              onEdit={() => setEditingMovie(movie)}
              onDelete={() => onDeleteMovie && onDeleteMovie(movie.id)}
            />
          ))}
        </div>
        
        {filteredMovies.length === 0 && (
          <div className="no-movies">
            <span className="no-movies-icon">🎬</span>
            <span className="no-movies-text">
              {searchQuery || selectedGenre !== 'all' || selectedYear !== 'all' 
                ? 'No movies match your filters' 
                : 'No movies found'}
            </span>
          </div>
        )}
      </div>

      {/* Add/Edit Movie Modal */}
      {(showAddModal || editingMovie) && (
        <MovieModal
          movie={editingMovie}
          onSave={(movieData) => {
            if (editingMovie) {
              onEditMovie && onEditMovie(editingMovie.id, movieData);
              setEditingMovie(null);
            } else {
              onAddMovie && onAddMovie(movieData);
              setShowAddModal(false);
            }
          }}
          onCancel={() => {
            setShowAddModal(false);
            setEditingMovie(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Individual Movie Item Component
 */
const MovieItem = ({ movie, viewMode, isSelected, onSelect, onEdit, onDelete }) => {
  const { t } = useTranslation();

  if (viewMode === 'grid') {
    return (
      <div className={`movie-card ${isSelected ? 'selected' : ''}`}>
        <div className="movie-card-header">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="movie-select"
          />
          <div className="movie-actions">
            <button className="action-btn edit" onClick={onEdit} title="Edit">
              ✏️
            </button>
            <button className="action-btn delete" onClick={onDelete} title="Delete">
              🗑️
            </button>
          </div>
        </div>
        
        <div className="movie-poster">
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} />
          ) : (
            <div className="poster-placeholder">🎬</div>
          )}
        </div>
        
        <div className="movie-info">
          <h3 className="movie-title">{movie.title}</h3>
          <p className="movie-genre">{movie.genre}</p>
          <div className="movie-meta">
            <span className="movie-year">{movie.year}</span>
            <span className="movie-rating">⭐ {movie.rating}</span>
          </div>
          <div className="movie-stats">
            <span className="movie-views">👁️ {movie.views}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`movie-row ${isSelected ? 'selected' : ''}`}>
      <div className="select-column">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      </div>
      <div className="title-column">
        <div className="movie-title-with-poster">
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} className="mini-poster" />
          ) : (
            <div className="mini-poster-placeholder">🎬</div>
          )}
          <span className="movie-title">{movie.title}</span>
        </div>
      </div>
      <div className="genre-column">{movie.genre}</div>
      <div className="year-column">{movie.year}</div>
      <div className="rating-column">⭐ {movie.rating}</div>
      <div className="views-column">👁️ {movie.views}</div>
      <div className="actions-column">
        <button className="action-btn edit" onClick={onEdit} title="Edit">
          ✏️
        </button>
        <button className="action-btn delete" onClick={onDelete} title="Delete">
          🗑️
        </button>
      </div>
    </div>
  );
};

/**
 * Movie Add/Edit Modal Component
 */
const MovieModal = ({ movie, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: movie?.title || '',
    genre: movie?.genre || '',
    year: movie?.year || new Date().getFullYear(),
    rating: movie?.rating || 0,
    description: movie?.description || '',
    poster: movie?.poster || '',
    trailer: movie?.trailer || '',
    duration: movie?.duration || '',
    director: movie?.director || '',
    cast: movie?.cast || '',
    ...movie
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="movie-modal-overlay">
      <div className="movie-modal">
        <div className="modal-header">
          <h2>{movie ? 'Edit Movie' : 'Add New Movie'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="movie-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t("title")} *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t("year")}</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear() + 5}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t("genre")}</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                placeholder="Action, Drama, Comedy"
              />
            </div>
            <div className="form-group">
              <label>{t("rating")}</label>
              <input
                type="number"
                value={formData.rating}
                onChange={(e) => handleChange('rating', parseFloat(e.target.value))}
                min="0"
                max="10"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="3"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Director</label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => handleChange('director', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                min="1"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Cast</label>
            <input
              type="text"
              value={formData.cast}
              onChange={(e) => handleChange('cast', e.target.value)}
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Poster URL</label>
              <input
                type="url"
                value={formData.poster}
                onChange={(e) => handleChange('poster', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Trailer URL</label>
              <input
                type="url"
                value={formData.trailer}
                onChange={(e) => handleChange('trailer', e.target.value)}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              {movie ? 'Update Movie' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

