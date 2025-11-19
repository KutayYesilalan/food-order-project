import { createContext, useReducer, useEffect } from "react";

const CartContext = createContext({
    items: [],
    addItem: (item) => { },
    removeItem: (id) => { },
    clearCart: () => { }
});

const CART_STORAGE_KEY = 'food-order-cart';
const CART_EXPIRY_DAYS = 7;

function cartReducer(state, action) {
    if (action.type === 'ADD_ITEM') {
        const existingCartItemIndex = state.items.findIndex((item) => item.id === action.item.id);
        const updatedItems = [...state.items];

        if (existingCartItemIndex > -1) {
            const existingItem = state.items[existingCartItemIndex];
            const updatedItem = {
                ...existingItem,
                quantity: existingItem.quantity + 1
            }
            updatedItems[existingCartItemIndex] = updatedItem;
        } else {
            updatedItems.push({ ...action.item, quantity: 1 });
            return {
                items: updatedItems
            }
        }

        return { ...state, items: updatedItems };
    }

    if (action.type === 'REMOVE_ITEM') {
        const existingCartItemIndex = state.items.findIndex((item) => item.id === action.id);
        const updatedItems = [...state.items];
        const existingItem = state.items[existingCartItemIndex];
        if (existingItem.quantity === 1) {
            updatedItems.splice(existingCartItemIndex, 1);
        } else {
            const updatedItem = {
                ...existingItem,
                quantity: existingItem.quantity - 1
            }
            updatedItems[existingCartItemIndex] = updatedItem;
        }
        return { ...state, items: updatedItems };
    }
    if (action.type === 'CLEAR_CART') {
        return { ...state, items: [] };
    }
    return state;
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (!savedCart) return { items: [] };

        const { items, timestamp } = JSON.parse(savedCart);

        // Check if cart has expired (7 days)
        const now = new Date().getTime();
        const expiryTime = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        if (now - timestamp > expiryTime) {
            // Cart expired, clear it
            localStorage.removeItem(CART_STORAGE_KEY);
            return { items: [] };
        }

        return { items };
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return { items: [] };
    }
}

function saveCartToStorage(items) {
    try {
        const cartData = {
            items,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
}

export function CartContextProvider({ children }) {

    const [cart, dispatchCartAction] = useReducer(cartReducer, null, loadCartFromStorage);

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        saveCartToStorage(cart.items);
    }, [cart.items]);

    function addItem(item) {
        dispatchCartAction({ type: 'ADD_ITEM', item });
    }
    function removeItem(id) {
        dispatchCartAction({ type: 'REMOVE_ITEM', id });
    }
    function clearCart() {
        dispatchCartAction({ type: 'CLEAR_CART' });
    }

    const cartContext = {
        items: cart.items,
        addItem,
        removeItem,
        clearCart
    }

    return <CartContext.Provider value={cartContext}>{children}</CartContext.Provider>
}

export default CartContext;