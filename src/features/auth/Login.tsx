import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../../shared/api/greenApi';
import type { LoginInput } from './useAuth';

export default function Login({ onLogin }: { onLogin: (creds: LoginInput) => Promise<void> }) {
  const [form, setForm] = useState<LoginInput>({ idInstance: '', apiTokenInstance: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof LoginInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value.trim() }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(form);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('Неверный idInstance или apiTokenInstance');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Вход через GREEN-API</h1>
        <p className="muted">Данные инстанса есть в личном кабинете console.green-api.com</p>

        <label>
          <span>idInstance</span>
          <input
            value={form.idInstance}
            onChange={set('idInstance')}
            inputMode="numeric"
            required
            autoFocus
          />
        </label>
        <label>
          <span>apiTokenInstance</span>
          <input
            value={form.apiTokenInstance}
            onChange={set('apiTokenInstance')}
            type="password"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
