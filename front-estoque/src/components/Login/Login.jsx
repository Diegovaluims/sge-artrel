// Login.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoArtrel from '../../assets/logo_artrel_novo.png';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErro('Preencha email e senha.');
      return;
    }
    
    setLoading(true);
    setErro('');

    try {
      await login(email, password);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logoArtrel} alt="Logo ARTREL" className="login-logo" />
          <h2>SGE ARTREL</h2>
          <p>Faça login para acessar o sistema.</p>
        </div>

        {erro && <div className="login-error">{erro}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu.email@artrel.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
