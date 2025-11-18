import MealItem from "./MealItem.jsx";
import useHttp from "../hooks/useHttp.js";
import Error from "./Error.jsx";
const requestConfig = {}
export default function Meals() {


    const {
        data: loadedMeals,
        isLoading,
        error
    } = useHttp('http://localhost:3000/meals', requestConfig, []);

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
        <ul id="meals">
            {loadedMeals && loadedMeals.map(meal => (
                <MealItem key={meal.id} meal={meal} />
            ))}
        </ul>
    );
}