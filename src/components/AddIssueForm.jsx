import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, HelpCircle, Plus } from 'lucide-react';

function createInitialSteps(issueToEdit) {
  if (issueToEdit?.resolutionSteps?.length) {
    return issueToEdit.resolutionSteps.map((step) => ({
      ...step,
      id: step.id || `step-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      images: step.images || []
    }));
  }

  const lines = issueToEdit?.resolution
    ? issueToEdit.resolution.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    : [];

  const steps = lines.map((text, index) => ({
    id: `step-${Date.now()}-${index}`,
    text,
    images: index === 0 ? issueToEdit?.images || [] : []
  }));

  if (steps.length === 0) {
    steps.push({
      id: `step-${Date.now()}-0`,
      text: '',
      images: []
    });
  }

  return steps;
}

export default function AddIssueForm({ categories, onCancel, onSave, issueToEdit }) {
  const [categoryId, setCategoryId] = useState(issueToEdit?.categoryId || categories[0]?.id || '');
  const [title, setTitle] = useState(issueToEdit?.title || '');
  const [description, setDescription] = useState(issueToEdit?.description || '');
  const [steps, setSteps] = useState(() => createInitialSteps(issueToEdit));
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (issueToEdit) {
      if (issueToEdit.categoryId && issueToEdit.categoryId !== categoryId) {
        setCategoryId(issueToEdit.categoryId);
      }
      if (issueToEdit.title && issueToEdit.title !== title) {
        setTitle(issueToEdit.title);
      }
    } else if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, issueToEdit, categoryId, title]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        text: '',
        images: []
      }
    ]);
  };

  const removeStep = (stepId) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
  };

  const updateStepText = (stepId, text) => {
    setSteps((prev) => prev.map((step) => step.id === stepId ? { ...step, text } : step));
  };

  const handleStepImageChange = async (stepId, e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = null;
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      if (!window.electronAPI || !window.electronAPI.uploadImage) {
        throw new Error('Electron API non disponibile. Avvia l\'app con Electron (npm start).');
      }

      const uploadedNames = [];
      for (const file of files) {
        const filePath = file.path || null;
        if (!filePath) {
          if (window.electronAPI.uploadImageFile) {
            const remoteName = await window.electronAPI.uploadImageFile(file);
            uploadedNames.push(remoteName);
            continue;
          }
          throw new Error('Percorso file non disponibile. Assicurati di usare Electron.');
        }
        const remoteName = await window.electronAPI.uploadImage(filePath);
        uploadedNames.push(remoteName);
      }

      setSteps((prev) => prev.map((step) => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          images: [...(step.images || []), ...uploadedNames]
        };
      }));
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message || 'Errore durante il caricamento delle immagini del passo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveStepImage = (stepId, imageIndex) => {
    setSteps((prev) => prev.map((step) => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        images: step.images.filter((_, idx) => idx !== imageIndex)
      };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validSteps = steps.filter((step) => step.text.trim().length > 0);
    if (!title.trim() || !categoryId || validSteps.length === 0) {
      setError('Compila tutti i campi obbligatori (Titolo, Categoria, almeno un passo di risoluzione).');
      return;
    }

    try {
      setError('');
      const resolutionSteps = steps.map((step) => ({
        id: step.id,
        text: step.text.trim(),
        images: step.images || []
      }));
      const resolution = resolutionSteps.map((step) => step.text).join('\n');

      await onSave({
        categoryId,
        title: title.trim(),
        description: description.trim(),
        resolution,
        resolutionSteps
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
              disabled={categories.length === 0}
            >
              <option value="" disabled>Seleziona categoria</option>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Procedura di Risoluzione *</label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addStep}>
              <Plus size={14} style={{ marginRight: '6px' }} />
              Aggiungi passo
            </button>
          </div>
          <div className="info-alert">
            <HelpCircle size={16} className="info-alert-icon" />
            <span>Ogni passo può avere una descrizione e immagini allegate. Puoi modificare o rimuovere ogni passaggio.</span>
          </div>

          {steps.map((step, index) => (
            <div key={step.id} className="step-card">
              <div className="step-card-header">
                <span>Passo {index + 1}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => removeStep(step.id)}
                  disabled={steps.length === 1}
                >
                  Rimuovi
                </button>
              </div>

              <textarea
                className="form-control"
                rows="3"
                placeholder="Descrivi il singolo passaggio..."
                value={step.text}
                onChange={(e) => updateStepText(step.id, e.target.value)}
              />

              <div className="step-attachment-row">
                <label className="upload-step-zone">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleStepImageChange(step.id, e)}
                    disabled={isUploading}
                  />
                  <div className="upload-icon">
                    <Upload size={18} />
                  </div>
                  <div className="upload-text">
                    {isUploading ? 'Caricamento immagini...' : 'Aggiungi immagini a questo passo'}
                  </div>
                </label>

                {step.images?.length > 0 && (
                  <div className="step-image-previews">
                    {step.images.map((imgName, imgIndex) => (
                      <div key={imgName + imgIndex} className="step-image-thumb">
                        <img src={`app-media://${imgName}`} alt={`Step ${index + 1} immagine ${imgIndex + 1}`} />
                        <button
                          type="button"
                          className="preview-remove"
                          onClick={() => handleRemoveStepImage(step.id, imgIndex)}
                          title="Rimuovi immagine"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
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
