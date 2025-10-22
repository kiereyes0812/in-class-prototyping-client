import { useState, useMemo, useContext } from 'react';
import { Form, Button, InputGroup, ProgressBar } from 'react-bootstrap';
import { useNavigate, Navigate } from 'react-router-dom';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import UserContext from '../UserContext';

export default function Register() {
  const notyf = new Notyf({ duration: 2500, dismissible: true });
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // form state
 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');

  // ui state
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  // strength score: 0–5
  const passScore = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[a-z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  const passwordsMatch = password !== '' && password === confirmPassword;

  const formValid =
    isValidEmail(email) && passScore >= 3 && passwordsMatch && agree;

  const registerUser = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const res = await fetch('https://in-class-prototyping-api.onrender.com/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        userName:  userName.trim(),
        mobileNo:  mobileNo.trim(),
        password:  password.trim()
      })
    }); // <-- important: close fetch with );

    // parse JSON safely
    const data = await res.json().catch(() => ({}));

    // handle non-2xx
    if (!res.ok) {
      notyf.error(data.message || 'Registration failed. Try again.');
      return;
    }

    // success
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgree(false);
    notyf.success('Registration successful! You can now log in.');
    navigate('/login');

  } catch (err) {
    console.error(err);
    notyf.error('Network error. Try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  // Optional: if already logged in, redirect away from register
  if (user?.id) return <Navigate to="/allPosts" replace />;

  const strengthNow = (passScore / 5) * 100;
  const strengthLabel =
    passScore <= 2 ? 'Weak' : passScore === 3 ? 'Fair' : passScore === 4 ? 'Good' : 'Strong';

  return (
    <div className="auth-wrapper">
      <div className="app-container-narrow">
        <div className="card p-4 p-sm-5 shadow-sm rounded-4">
          <h1 className="h3 text-center mb-4">Create your account</h1>

          <Form onSubmit={registerUser} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>First name</Form.Label>
              <Form.Control value={firstName} onChange={e=>setFirstName(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last name</Form.Label>
              <Form.Control value={lastName} onChange={e=>setLastName(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control value={userName} onChange={e=>setUserName(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mobile number</Form.Label>
              <Form.Control value={mobileNo} onChange={e=>setMobileNo(e.target.value)} required />
            </Form.Group>
            {/* Email */}
            <Form.Group className="mb-3" controlId="regEmail">
              <Form.Label className="fw-semibold">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="lg"
                isInvalid={email !== '' && !isValidEmail(email)}
                autoComplete="email"
              />
              <Form.Control.Feedback type="invalid">
                Please enter a valid email address.
              </Form.Control.Feedback>
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-2" controlId="regPassword">
              <Form.Label className="fw-semibold">Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPass ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  isInvalid={password !== '' && passScore < 3}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? 'Hide' : 'Show'}
                </Button>
              </InputGroup>
              <div className="mt-2">
                <ProgressBar
                  now={strengthNow}
                  label={password ? strengthLabel : ''}
                  visuallyHidden={!password}
                />
                <small className="text-muted">
                  Use 8+ characters with a mix of upper/lowercase, numbers, and symbols.
                </small>
              </div>
            </Form.Group>

            {/* Confirm Password */}
            <Form.Group className="mb-3" controlId="regConfirm">
              <Form.Label className="fw-semibold">Confirm Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="lg"
                  isInvalid={confirmPassword !== '' && !passwordsMatch}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </Button>
              </InputGroup>
              <Form.Control.Feedback type="invalid">
                Passwords do not match.
              </Form.Control.Feedback>
            </Form.Group>

            {/* Terms */}
            <Form.Group controlId="regTos" className="mb-4">
              <Form.Check
                type="checkbox"
                label={
                  <>
                    I agree to the{' '}
                    <a href="#!" className="text-decoration-none">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#!" className="text-decoration-none">
                      Privacy Policy
                    </a>
                    .
                  </>
                }
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
            </Form.Group>

            {/* Submit */}
            <Button
              variant="primary"
              type="submit"
              className="w-100 py-2"
              disabled={!formValid || isSubmitting}
            >
              {isSubmitting ? 'Creating…' : 'Create Account'}
            </Button>
          </Form>

          <p className="text-center text-muted small mt-3 mb-0">
            Already have an account?{' '}
            <a href="/login" className="text-decoration-none">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
