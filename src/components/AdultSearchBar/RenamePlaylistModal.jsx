import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RenamePlaylistModal = ({ isOpen, onClose, onRename, currentName }) => {
  const [newName, setNewName] = useState(currentName);
  const { t } = useTranslation();

  useEffect(() => {
    setNewName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onRename(newName.trim());
    }
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    }
  };

  return (
    <div className="playlist-modal-overlay">
      <div className="playlist-modal">
        <div className="modal-header">
          <h4>{t('rename_playlist')}</h4>
          <button onClick={onClose} className="close-modal-btn">&times;</button>
        </div>
        <div className="input-group">
          <label htmlFor="playlist-new-name">{t('playlist_name')}</label>
          <input
            id="playlist-new-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('enter_new_name')}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">{t('cancel')}</button>
          <button onClick={handleRename} className="create-btn">{t('rename')}</button>
        </div>
      </div>
    </div>
  );
};

export default RenamePlaylistModal; 