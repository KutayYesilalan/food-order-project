import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import Button from './UI/Button.jsx';
import CartContext from '../store/CartContext.jsx';
import UserProgressContext from '../store/UserProgressContext.jsx';
import AuthContext from '../store/AuthContext.jsx';

export default function Header() {

  const cartCtx = useContext(CartContext);
  const userProgressCtx = useContext(UserProgressContext);
  const { isAuthenticated, user } = useContext(AuthContext);
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

  return (
    <header id="main-header">
        <div id="title">
            <img src={logoImg} alt="A restaurant" />
            <h1>Foodie</h1>
        </div>
        <nav>
            <Button textOnly onClick={handleShowCart}>Cart ({totalCartItems})</Button>
            {isAuthenticated ? (
              <>
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