import { createContext, useState } from 'react';

const UserProgressContext = createContext({
    progress: '',
    showCart: () => { },
    hideCart: () => { },
    showCheckout: () => { },
    hideCheckout: () => { },
    showLogin: () => { },
    hideLogin: () => { },
    showSignup: () => { },
    hideSignup: () => { }
});

function UserProgressContextProvider({ children }) {

    const [userProgress, setUserProgress] = useState('');

    function showCart() {
        setUserProgress('cart');
    }

    function hideCart() {
        setUserProgress('');
    }
    function showCheckout() {
        setUserProgress('checkout');
    }
    function hideCheckout() {
        setUserProgress('');
    }
    function showLogin() {
        setUserProgress('login');
    }
    function hideLogin() {
        setUserProgress('');
    }
    function showSignup() {
        setUserProgress('signup');
    }
    function hideSignup() {
        setUserProgress('');
    }

    const userProgressCtx = {
        progress: userProgress,
        showCart: showCart,
        hideCart: hideCart,
        showCheckout: showCheckout,
        hideCheckout: hideCheckout,
        showLogin: showLogin,
        hideLogin: hideLogin,
        showSignup: showSignup,
        hideSignup: hideSignup
    }

    return (
        <UserProgressContext.Provider value={userProgressCtx}>{children}</UserProgressContext.Provider>
    );
}

export { UserProgressContextProvider };
export default UserProgressContext;