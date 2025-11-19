import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import Header from './components/Header';
import Meals from './components/Meals';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import UserProfile from './components/UserProfile.jsx';
import { CartContextProvider } from './store/CartContext.jsx';
import { UserProgressContextProvider } from './store/UserProgressContext.jsx';
import { AuthContextProvider } from './store/AuthContext.jsx';
import { ThemeContextProvider } from './store/ThemeContext.jsx';

function HomePage() {
  return (
    <>
      <Meals />
      <Cart />
      <Checkout />
      <Login />
      <Signup />
    </>
  );
}

function App() {
  return (
    <ThemeContextProvider>
      <AuthContextProvider>
        <CartContextProvider>
          <UserProgressContextProvider>
            <BrowserRouter>
              <Header />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<UserProfile />} />
              </Routes>
            </BrowserRouter>
          </UserProgressContextProvider>
        </CartContextProvider>
      </AuthContextProvider>
    </ThemeContextProvider>
  );
}

export default App;
