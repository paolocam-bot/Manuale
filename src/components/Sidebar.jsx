import React from 'react';
import { Layers, FolderPlus, HardDrive } from 'lucide-react';

export default function Sidebar({
  categories,
  issues,
  selectedCategory,
  onSelectCategory,
  onAddCategoryClick,
  onViewChange
}) {
  // Count issues per category
  const getCount = (catId) => {
    if (catId === 'all') return issues.length;
    return issues.filter(i => i.categoryId === catId).length;
  };

  const handleSelect = (catId) => {
    onSelectCategory(catId);
    onViewChange('list');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HardDrive size={22} />
        </div>
        <span className="sidebar-title">IT Support Manual</span>
      </div>
      
      <div className="sidebar-menu">
        <div className="sidebar-menu-title">Categorie</div>
        
        <div 
          className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleSelect('all')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} />
            Tutte le Categorie
          </span>
          <span className="category-count">{getCount('all')}</span>
        </div>
        
        {categories.map((cat) => (
          <div 
            key={cat.id}
            className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleSelect(cat.id)}
          >
            <span>{cat.name}</span>
            <span className="category-count">{getCount(cat.id)}</span>
          </div>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <button className="btn btn-secondary" onClick={onAddCategoryClick}>
          <FolderPlus size={16} />
          Nuova Categoria
        </button>
      </div>
    </div>
  );
}
