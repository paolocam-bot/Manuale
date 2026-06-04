import React, { useState } from 'react';
import { ArrowLeft, Upload, X, HelpCircle } from 'lucide-react';

export default function AddIssueForm({ categories, onCancel, onSave, issueToEdit }) {
  const [categoryId, setCategoryId] = useState(issueToEdit?.categoryId || categories[0]?.id || '');
  const [title, setTitle] = useState(issueToEdit?.title || '');
  const [description, setDescription] = useState(issueToEdit?.description || '');
  const [resolution, setResolution] = useState(issueToEdit?.resolution || '');
  const [images, setImages] = useState(issueToEdit?.images || []); // Array of strings (filenames)
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');
    
    try {
      const uploadedNames = [];
      for (const file of files) {
        // Expose DOM file to the preload webUtils handler
        const remoteName = await window.electronAPI.uploadImageFile(file);
        uploadedNames.push(remoteName);
      }
      setImages(prev => [...prev, ...uploadedNames]);
    } catch (err) {
      console.error('File upload error:', err);
      setError('Errore durante il caricamento di alcune immagini. Assicurati che siano formati validi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !resolution.trim()) {
      setError('Compila tutti i campi obbligatori (Titolo, Categoria, Risoluzione).');
      return;
    }

    try {
      setError('');
      await onSave({
        categoryId,
        title: title.trim(),
        description: description.trim(),
        resolution: resolution.trim(),
        images
      });
    } catch (err) {
      setError(err.message || 'Errore durante il salvataggio.');
    }
  };

  return (
    <div className="detail-view">
      <div className="detail-back" onClick={onCancel}>
        <ArrowLeft size={16} />
        Annulla e torna indietro
      </div>

      <h1 className="detail-title" style={{ marginBottom: '24px' }}>
        {issueToEdit ? 'Modifica Problema' : 'Nuova Problematica'}
      </h1>

      <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '32px' }}>
        {error && (
          <div style={{ 
            color: 'var(--accent-danger)', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px', 
            fontSize: '0.9rem' 
          }}>
            {error}
          </div>
        )}

        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Categoria *</label>
            <select 
              className="form-control"
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Titolo *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Es. Stampante offline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descrizione del Problema</label>
          <textarea 
            className="form-control" 
            rows="3" 
            placeholder="Descrivi brevemente il problema, messaggi d'errore o il contesto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Procedura di Risoluzione *</label>
          <div className="info-alert">
            <HelpCircle size={16} className="info-alert-icon" />
            <span>Inserisci la procedura passo dopo passo. Vai a capo (tasto Invio) per separare i singoli step. Verranno numerati in ordine automaticamente.</span>
          </div>
          <textarea 
            className="form-control" 
            rows="6" 
            placeholder="Es.&#10;Scollega il cavo USB&#10;Riavvia il computer&#10;Ricollega il cavo e riprova"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            required
            style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Screenshot / Immagini allegate</label>
          <label className="upload-zone">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
              disabled={isUploading}
            />
            <div className="upload-icon">
              <Upload size={24} style={{ margin: '0 auto' }} />
            </div>
            <div className="upload-text">
              {isUploading ? (
                'Caricamento file...'
              ) : (
                <>
                  Clicca qui per <span className="upload-text-highlight">sfogliare e caricare</span> screenshot del problema/risoluzione
                </>
              )}
            </div>
          </label>

          {images.length > 0 && (
            <div className="upload-previews">
              {images.map((imgName, index) => (
                <div key={index} className="preview-thumb">
                  <img src={`app-media://${imgName}`} alt={`Anteprima ${index + 1}`} />
                  <button 
                    type="button" 
                    className="preview-remove"
                    onClick={() => handleRemoveImage(index)}
                    title="Rimuovi immagine"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Annulla</button>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={isUploading}>
            {issueToEdit ? 'Salva Modifiche' : 'Salva Risoluzione'}
          </button>
        </div>
      </form>
    </div>
  );
}
