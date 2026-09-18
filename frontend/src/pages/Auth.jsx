import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginAccount, signUpAccount } from '../lib/api';
import useStore from '../store/useStore';

export default function Auth({ mode }) {
  const signUp = mode === 'signup';
  const navigate = useNavigate();
  const setAuth = useStore((state) => state.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const result = signUp ? await signUpAccount(form) : await loginAccount({ email: form.email, password: form.password });
      setAuth(result); navigate('/onboarding');
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }
  return <main className="auth-page"><Link className="auth-brand" to="/"><b>✦</b> fin<span>wise</span></Link><section className="auth-card"><p className="auth-eyebrow">{signUp ? 'LET’S GET STARTED' : 'WELCOME BACK'}</p><h1>{signUp ? 'Make room for what matters.' : 'Your money story is waiting.'}</h1><p className="auth-subtitle">{signUp ? 'Create your free account and make your first money map in minutes.' : 'Sign in to return to your financial plan.'}</p><form onSubmit={submit}>{signUp && <label>Your name<input required minLength="2" value={form.name} onChange={update('name')} placeholder="Your name" /></label>}<label>Email address<input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" /></label><label>Password<input required type="password" minLength="8" value={form.password} onChange={update('password')} placeholder="At least 8 characters" /></label>{error && <p className="auth-error">{error}</p>}<button className="landing-button auth-submit" disabled={loading}>{loading ? 'Just a moment…' : signUp ? 'Create my account →' : 'Sign in →'}</button></form><p className="auth-switch">{signUp ? 'Already have an account?' : 'New to Finwise?'} <Link to={signUp ? '/login' : '/signup'}>{signUp ? 'Sign in' : 'Create an account'}</Link></p></section><p className="auth-note">Protected with secure account authentication.</p></main>;
}
