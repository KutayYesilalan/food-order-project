import { useContext } from "react";
import { currencyFormatter } from "../util/formatting.js";
import Button from "./UI/Button.jsx";
import CartContext from "../store/CartContext.jsx";

const BACKEND_URL = "http://localhost:3000";

export default function MealItem({ meal }) {
    const cartCtx = useContext(CartContext);
    const { image, name, price, description } = meal;

    function handleAddMealToCart() {
        cartCtx.addItem(meal);
    }

    return (
        <li className="meal-item">
            <article>
                <img src={`${BACKEND_URL}/${image}`} alt={name} />
                <div>
                    <h3>{name}</h3>
                    <p className="meal-item-price">{currencyFormatter.format(price)}</p>
                    <p className="meal-item-description">{description}</p>
                </div>
                <div className="meal-item-actions">
                    <Button onClick={handleAddMealToCart}>Add to Cart</Button>
                </div>
            </article>
        </li>
    );
}