export default function FilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedPriceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange
}) {
  // Available categories
  const categories = [
    { value: 'all', label: 'All' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'salad', label: 'Salad' },
    { value: 'burger', label: 'Burger' },
    { value: 'seafood', label: 'Seafood' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'other', label: 'Other' }
  ];

  // Price range options
  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'low', label: 'Under $10' },
    { value: 'medium', label: '$10 - $15' },
    { value: 'high', label: 'Above $15' }
  ];

  return (
    <div className="filter-bar">
      {/* Search Input */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search meals..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Category Filters */}
      <div className="filter-section">
        <h3>Categories</h3>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.value}
              className={selectedCategory === category.value ? 'active' : ''}
              onClick={() => onCategoryChange(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filters */}
      <div className="filter-section">
        <h3>Price Range</h3>
        <div className="price-filters">
          {priceRanges.map(range => (
            <button
              key={range.value}
              className={selectedPriceRange === range.value ? 'active' : ''}
              onClick={() => onPriceRangeChange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="sort-box">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="default">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
        </select>
      </div>
    </div>
  );
}
