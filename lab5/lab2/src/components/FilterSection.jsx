import { useState, useCallback } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';

function FilterSection() {
  const { filter, searchQuery, setFilter, setSearchQuery } = useTaskContext();
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
  }, [searchInput, setSearchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
    // Автоматический поиск с задержкой
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setSearchQuery(e.target.value.trim());
    }, 300);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="filter-section">
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          <i className="fas fa-list"></i> Все задачи
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => handleFilterClick('active')}
        >
          <i className="fas fa-clock"></i> Активные
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterClick('completed')}
        >
          <i className="fas fa-check-circle"></i> Выполненные
        </button>
      </div>
      
      <div className="search-section">
        <div className="search-input-group">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyPress={handleSearchKeyPress}
            placeholder="Поиск задач..."
            className="search-input"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="btn btn-search"
          >
            <i className="fas fa-search"></i>
          </button>
          <button
            type="button"
            onClick={handleClearSearch}
            className="btn btn-clear"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterSection;
