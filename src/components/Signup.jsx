import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../store/AuthContext';
import Modal from './UI/Modal';
import Input from './UI/Input';
import Button from './UI/Button';
import UserProgressContext from '../store/UserProgressContext';

export default function Signup() {
  const { signup } = useContext(AuthContext);
  const userProgressCtx = useContext(UserProgressContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      signup(data.token, data.user);
      userProgressCtx.hideSignup();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    userProgressCtx.hideSignup();
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  function handleSwitchToLogin() {
    userProgressCtx.hideSignup();
    userProgressCtx.showLogin();
  }

  return (
    <Modal
      className="signup"
      open={userProgressCtx.progress === 'signup'}
      onClose={handleClose}
    >
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          minLength={6}
        />
        <Input
          label="Confirm Password"
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <Button type="button" textOnly onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </div>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={handleSwitchToLogin} className="link-button">
          Login
        </button>
      </p>
    </Modal>
  );
}
