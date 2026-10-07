import { useState } from 'react';
import { signIn } from '../services/authService.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const data = await signIn(email.trim(), password);
      onLogin(data.session);
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="card login-card">
        <img className="login-wordmark" src="/assets/workscape-wordmark.png" alt="Workscape" />
        <div className="login-copy">
          <span className="role-badge">Maintenance Learning App</span>
          <h1>Sign in</h1>
          <p>Use your Supabase Auth account to continue.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              className="control"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              className="control"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
      </section>
    </main>
  );
}
