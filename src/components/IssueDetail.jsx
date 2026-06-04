import React, { useState } from 'react';
import { ArrowLeft, Trash2, Info, ZoomIn, Edit } from 'lucide-react';

export default function IssueDetail({ issue, categories, onBack, onDelete, onEdit }) {
  const [activeImage, setActiveImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Generico';
  };

  const steps = issue.resolution
    ? issue.resolution.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    : [];

  const cleanStepText = (stepStr) => {
    // Strips common step prefixes (like "1. ", "1) ", "- ", "* ")
    return stepStr.replace(/^(?:\d+[\.\)]|[\-\*])\s*/, '');
  };

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare definitivamente questo problema? La rimozione comprende anche i file immagine associati.')) {
      setIsDeleting(true);
      try {
        await onDelete(issue.id);
      } catch (err) {
        alert('Errore durante l\'eliminazione: ' + err.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="detail-view">
      <div className="detail-back" onClick={onBack}>
        <ArrowLeft size={16} />
        Torna alla lista
      </div>

      <div className="detail-header">
        <div className="detail-meta">
          <span className="issue-badge">{getCategoryName(issue.categoryId)}</span>
          <div className="detail-actions">
            <button 
              className="detail-btn-icon" 
              onClick={onEdit}
              title="Modifica problema"
              style={{ marginRight: '8px' }}
            >
              <Edit size={16} />
            </button>
            <button 
              className="detail-btn-icon" 
              onClick={handleDelete}
              disabled={isDeleting}
              title="Elimina problema"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <h1 className="detail-title">{issue.title}</h1>
        <p className="detail-desc">{issue.description}</p>
      </div>

      <div className="resolution-steps-box">
        <h3 className="section-title">
          <Info size={18} style={{ color: 'var(--accent-indigo)' }} />
          Soluzione e Risoluzione
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Nessuna procedura inserita per questo problema.</p>
          ) : (
            steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-hover))',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
                }}>
                  {idx + 1}
                </div>
                <div style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: '0.975rem', 
                  lineHeight: '1.6',
                  flex: 1
                }}>
                  {cleanStepText(step)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {issue.images && issue.images.length > 0 && (
        <div className="detail-images-section">
          <h3 className="section-title">Screenshot e Allegati</h3>
          <div className="images-grid">
            {issue.images.map((imgName, index) => (
              <div 
                key={index} 
                className="image-wrapper"
                onClick={() => setActiveImage(imgName)}
              >
                <img src={`app-media://${imgName}`} alt={`Screenshot ${index + 1}`} />
                <div className="image-overlay">
                  <ZoomIn size={24} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeImage && (
        <div className="lightbox" onClick={() => setActiveImage(null)}>
          <img src={`app-media://${activeImage}`} alt="Screenshot ingrandito" />
        </div>
      )}
    </div>
  );
}
