import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import Button from './UI/Button.jsx';
import CartContext from '../store/CartContext.jsx';
import UserProgressContext from '../store/UserProgressContext.jsx';
import AuthContext from '../store/AuthContext.jsx';
import ThemeContext from '../store/ThemeContext.jsx';

export default function Header() {

  const cartCtx = useContext(CartContext);
  const userProgressCtx = useContext(UserProgressContext);
  const { isAuthenticated, user, isAdmin } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const totalCartItems = cartCtx.items.reduce((totalNumberOfItems, item) => {
    return totalNumberOfItems + item.quantity;
  }, 0);

  function handleShowCart() {
    userProgressCtx.showCart();
  }

  function handleShowLogin() {
    userProgressCtx.showLogin();
  }

  function handleShowSignup() {
    userProgressCtx.showSignup();
  }

  function handleShowProfile() {
    navigate('/profile');
  }

  function handleShowAdmin() {
    navigate('/admin');
  }

  return (
    <header id="main-header">
        <div id="title">
            <img src={logoImg} alt="A restaurant" />
            <h1>Foodie</h1>
        </div>
        <nav>
            <Button textOnly onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
            <Button textOnly onClick={handleShowCart}>Cart ({totalCartItems})</Button>
            {console.log(isAdmin, isAuthenticated)}
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button textOnly onClick={handleShowAdmin}>
                    Admin Panel
                  </Button>
                )}
                <Button textOnly onClick={handleShowProfile}>
                  {user.name}
                </Button>
              </>
            ) : (
              <>
                <Button textOnly onClick={handleShowLogin}>Login</Button>
                <Button onClick={handleShowSignup}>Sign Up</Button>
              </>
            )}
        </nav>
    </header>
  );

}