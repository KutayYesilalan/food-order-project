import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../store/AuthContext';
import Modal from './UI/Modal';
import Input from './UI/Input';
import Button from './UI/Button';
import UserProgressContext from '../store/UserProgressContext';

export default function Login() {
  const { login } = useContext(AuthContext);
  const userProgressCtx = useContext(UserProgressContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.token, data.user);
      userProgressCtx.hideLogin();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    userProgressCtx.hideLogin();
    setError('');
    setEmail('');
    setPassword('');
  }

  function handleSwitchToSignup() {
    userProgressCtx.hideLogin();
    userProgressCtx.showSignup();
  }

  return (
    <Modal
      className="login"
      open={userProgressCtx.progress === 'login'}
      onClose={handleClose}
    >
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <Button type="button" textOnly onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </form>

      <p className="auth-switch">
        Don't have an account?{' '}
        <button type="button" onClick={handleSwitchToSignup} className="link-button">
          Sign up
        </button>
      </p>
    </Modal>
  );
}
