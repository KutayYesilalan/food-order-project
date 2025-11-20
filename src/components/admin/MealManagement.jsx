import { useEffect, useState, useContext } from 'react';
import AuthContext from '../../store/AuthContext';
import { currencyFormatter } from '../../util/formatting';

export default function MealManagement() {
  const { token } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    description: '',
    image: '',
    category: 'other'
  });

  const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'drinks', 'appetizers', 'snacks', 'seafood', 'pasta', 'pizza', 'salad', 'burger', 'other'];

  useEffect(() => {
    fetchMeals();
  }, []);

  async function fetchMeals() {
    try {
      const response = await fetch('http://localhost:3000/meals');
      if (!response.ok) throw new Error('Failed to fetch meals');
      const data = await response.json();
      setMeals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleAdd() {
    setEditingMeal(null);
    setFormData({
      id: `m${Date.now()}`,
      name: '',
      price: '',
      description: '',
      image: '',
      category: 'other'
    });
    setShowForm(true);
  }

  function handleEdit(meal) {
    setEditingMeal(meal);
    setFormData({
      id: meal.id,
      name: meal.name,
      price: meal.price,
      description: meal.description || '',
      image: meal.image || '',
      category: meal.category || 'other'
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingMeal(null);
    setFormData({
      id: '',
      name: '',
      price: '',
      description: '',
      image: '',
      category: 'other'
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const url = editingMeal
        ? `http://localhost:3000/admin/meals/${formData.id}`
        : 'http://localhost:3000/admin/meals';

      const method = editingMeal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save meal');
      }

      await fetchMeals();
      handleCancel();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(mealId) {
    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/admin/meals/${mealId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      await fetchMeals();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  if (isLoading) {
    return <div className="admin-loading"><p>Loading meals...</p></div>;
  }

  if (error) {
    return <div className="admin-error"><p>Error: {error}</p></div>;
  }

  return (
    <div className="meal-management">
      <div className="section-header">
        <h1>Meal Management</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add New Meal
        </button>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div className="modal meal-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMeal ? 'Edit Meal' : 'Add New Meal'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="id">Meal ID *</label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  disabled={editingMeal}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMeal ? 'Update Meal' : 'Add Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => (
              <tr key={meal.id}>
                <td>{meal.id}</td>
                <td>{meal.name}</td>
                <td>{currencyFormatter.format(meal.price)}</td>
                <td>
                  <span className="category-badge">{meal.category}</span>
                </td>
                <td className="description-cell">
                  {meal.description?.substring(0, 50)}
                  {meal.description?.length > 50 ? '...' : ''}
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleEdit(meal)}
                    className="btn-icon btn-edit"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="btn-icon btn-delete"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
