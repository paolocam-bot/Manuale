import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AddCategoryModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setError('');
      await onAdd(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Errore durante la creazione.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Aggiungi Categoria</h3>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              color: 'var(--accent-danger)', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '16px', 
              fontSize: '0.85rem' 
            }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Nome Categoria</label>
            <input
              type="text"
              className="form-control"
              placeholder="Es. Cloud, Windows, Server..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary">Aggiungi Categoria</button>
          </div>
        </form>
      </div>
    </div>
  );
}
