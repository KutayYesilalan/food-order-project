import Modal from "./UI/Modal";
import { useContext } from "react";
import CartContext from "../store/CartContext.jsx";
import UserProgressContext from "../store/UserProgressContext.jsx";
import { currencyFormatter } from "../util/formatting";
import Input from "./UI/Input.jsx";
import Button from "./UI/Button.jsx";

export default function Checkout() {

    const cartCtx = useContext(CartContext);
    const userProgressCtx = useContext(UserProgressContext);

    const cartTotal = cartCtx.items.reduce((totalPrice, item) => totalPrice + item.quantity * item.price, 0)

    function handleClose() {
        userProgressCtx.hideCheckout();
    }

    function handleSubmit(event) {
        event.preventDefault();

        const fd = new FormData(event.target);
    }
    return (
        <Modal className="checkout" open={userProgressCtx.progress === 'checkout'} onClose={handleClose}>
            <form onSubmit={handleSubmit}>
                <h2>
                    Checkout
                </h2>
                <p>
                    Total Amount: {currencyFormatter.format(cartTotal)}
                </p>
                <Input id="full-name" label="Full Name" type="text" />
                <Input id="email" label="E-mail Address" type="email" />
                <Input id="street" label="Street" type="text" />
                <div className="control-row">
                    <Input id="postal-code" label="Postal Code" type="text" />
                    <Input id="city" label="City" type="text" />
                </div>
                <p className="modal-actions">
                    <Button type='button' textOnly onClick={handleClose}>
                        Close
                    </Button>
                    <Button>
                        Submit Order
                    </Button>
                </p>
            </form>
        </Modal>
    )
}