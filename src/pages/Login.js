import { useState, useContext } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import UserContext from '../UserContext';

export default function Login() {
  const notyf = new Notyf({ duration: 2500, dismissible: true });
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  // back end expects: { identifier, password }
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const isActive = identifier.trim() !== '' && password.trim() !== '';

  async function authenticate(e) {
    e.preventDefault();
    if (!isActive) return;

    try {
      // 1) login
      const res = await fetch('http://localhost:4000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.access) {
        const msg =
          data?.message === 'Incorrect email or password'
            ? 'Incorrect credentials. Try again.'
            : (data?.message || 'Login failed. Try again.');
        notyf.error(msg);
        return;
      }

      // 2) store token
      localStorage.setItem('token', data.access);

      // 3) fetch profile using Bearer token
      const profRes = await fetch('http://localhost:4000/users/details', {
        headers: { Authorization: `Bearer ${data.access}` }
      });
      const prof = await profRes.json().catch(() => ({}));

      if (!profRes.ok || !prof?._id) {
        notyf.error('Could not load your profile.');
        return;
      }

      // 4) set user context and go to your app
      setUser({
        id: prof._id,
        isAdmin: Boolean(prof.isAdmin) || prof.role === 'admin'
      });
      notyf.success('Successful Login');
      navigate('/allPosts', { replace: true });

      // 5) clear fields
      setIdentifier('');
      setPassword('');
    } catch (err) {
      console.error(err);
      notyf.error('Network error. Please try again.');
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="auth-wrapper col-12 col-sm-10 col-md-7 col-lg-5">
            <div className="app-container-narrow">
              <div className="card p-4 p-sm-5">
                <h1 className="h3 text-center mb-4">Login</h1>

                <Form onSubmit={authenticate} noValidate>
                  <Form.Group controlId="identifier" className="mb-3">
                    <Form.Label className="fw-semibold">Email or Username</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="name@example.com or yourusername"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      size="lg"
                      required
                    />
                  </Form.Group>

                  <Form.Group controlId="password" className="mb-4">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="lg"
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2"
                    disabled={!isActive}
                  >
                    Sign In
                  </Button>
                </Form>

                <p className="text-center text-muted small mt-3 mb-0">
                  Forgot your password?{' '}
                  <a href="#!" className="text-decoration-none">Reset it</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
