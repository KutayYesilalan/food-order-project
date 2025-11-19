import MealItem from "./MealItem.jsx";
import useHttp from "../hooks/useHttp.js";
import Error from "./Error.jsx";
import { useState } from "react";
import FilterBar from "./FilterBar.jsx";
const requestConfig = {}
export default function Meals() {
    const { data: loadedMeals, isLoading, error } = useHttp('http://localhost:3000/meals', requestConfig, []);
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedPriceRange, setSelectedPriceRange] = useState('all')
    const [sortBy, setSortBy] = useState('default')


    const filteredMeals = loadedMeals?.filter(meal => {
        //search filter
        const matchesSearch = meal.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        //Category filter
        const matchesCategory = selectedCategory === 'all' || meal.category === selectedCategory;
        //price filter
        const price = parseFloat(meal.price);
        const matchesPrice = selectedPriceRange === 'all' ||
            (selectedPriceRange === 'low' && price < 10) ||
            (selectedPriceRange === 'medium' && price >= 10 && price <= 15) ||
            (selectedPriceRange === 'high' && price > 15);
        return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
        if (sortBy === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
        if (sortBy === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
    });

    if (isLoading) {
        return <section className="center">
            <p>Loading meals...</p>
        </section>
    }

    if (error) {
        return <section className="error">
            <Error title="Failed to fetch meals!" message={error} />
        </section>
    }

    return (
        <div className="meals-container">
            {/* Left Sidebar - FilterBar */}
            <aside className="sidebar">
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedPriceRange={selectedPriceRange}
                    onPriceRangeChange={setSelectedPriceRange}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />
            </aside>

            {/* Right Content - Meals Grid */}
            <main className="meals-content">
                <ul id="meals">
                    {filteredMeals && filteredMeals.length > 0 ? (
                        filteredMeals.map(meal => <MealItem key={meal.id} meal={meal} />)
                    ) : (
                        <p className="center">No meals found matching your filters.</p>
                    )}
                </ul>
            </main>
        </div>
    );
}