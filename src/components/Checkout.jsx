import Modal from "./UI/Modal";
import { useContext, useActionState, useMemo } from "react";
import CartContext from "../store/CartContext.jsx";
import UserProgressContext from "../store/UserProgressContext.jsx";
import AuthContext from "../store/AuthContext.jsx";
import { currencyFormatter } from "../util/formatting";
import Input from "./UI/Input.jsx";
import Button from "./UI/Button.jsx";
import useHttp from "../hooks/useHttp.js";
import Error from "./Error.jsx";

export default function Checkout() {

    const cartCtx = useContext(CartContext);
    const userProgressCtx = useContext(UserProgressContext);
    const { isAuthenticated, token } = useContext(AuthContext);

    const requestConfig = useMemo(() => ({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
    }), [token]);

    const { data, error, sendRequest, clearData } = useHttp('http://localhost:3000/orders', requestConfig);

    const cartTotal = cartCtx.items.reduce((totalPrice, item) => totalPrice + item.quantity * item.price, 0)

    function handleClose() {
        userProgressCtx.hideCheckout();
    }

    function handleFinish(){
        userProgressCtx.hideCheckout();
        cartCtx.clearCart();
        clearData()
    }

    function handleShowLogin() {
        userProgressCtx.hideCheckout();
        userProgressCtx.showLogin();
    }

    async function checkoutAction(prevState, fd) {
        const customerData = Object.fromEntries(fd.entries());

        await sendRequest(JSON.stringify({
            order: {
                items: cartCtx.items,
                customer: customerData
            },
        }));
    }

    const [formState, formAction, pending] = useActionState(checkoutAction, null);

    let actions = (
        <>
            <Button type='button' textOnly onClick={handleClose}>
                Close
            </Button>
            <Button>
                Submit Order
            </Button>

        </>
    )

    if (pending) {
        actions = <span>Sending Order Data...</span>
    }

    if (!isAuthenticated) {
        return (
            <Modal open={userProgressCtx.progress === 'checkout'} onClose={handleClose}>
                <h2>Login Required</h2>
                <p>You need to be logged in to place an order.</p>
                <p className="modal-actions">
                    <Button textOnly onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleShowLogin}>Login</Button>
                </p>
            </Modal>
        );
    }

    if (data && !error) {
        return (
            <Modal open={userProgressCtx.progress === 'checkout'} onClose={handleFinish}>
                <h2>Success!</h2>
                <p>Your order was successfully submitted.</p>
                <p>We will send details with email.</p>
                <p className="modal-actions"><Button onClick={handleFinish}>Okay</Button></p>

            </Modal>
        )

    }

    return (
        <Modal className="checkout" open={userProgressCtx.progress === 'checkout'} onClose={handleClose}>
            <form action={formAction}>
                <h2>
                    Checkout
                </h2>
                <p>
                    Total Amount: {currencyFormatter.format(cartTotal)}
                </p>
                <Input id="name" label="Full Name" type="text" />
                <Input id="email" label="E-mail Address" type="email" />
                <Input id="street" label="Street" type="text" />
                <div className="control-row">
                    <Input id="postal-code" label="Postal Code" type="text" />
                    <Input id="city" label="City" type="text" />
                </div>
                {error && <Error title={"Failed to submit order"} message={error} />}
                <p className="modal-actions">
                    {actions}
                </p>
            </form>
        </Modal>
    )
}