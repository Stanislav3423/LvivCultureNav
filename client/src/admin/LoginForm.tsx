import { useState, type FormEvent } from 'react';

interface Props {
  onLogin(key: string): Promise<boolean>;
}

export function LoginForm({ onLogin }: Props) {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!(await onLogin(key))) setError('Невірний ключ доступу. Спробуйте ще раз.');
    } catch {
      setError('Сервер недоступний. Спробуйте пізніше.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin">
      <form className="login" onSubmit={submit}>
        <h1>Вхід адміністратора</h1>
        <div className="field">
          <label htmlFor="admin-key">Ключ адміністратора</label>
          <input
            id="admin-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <span className="help">Ключ задається на сервері змінною ADMIN_KEY у файлі .env</span>
        </div>
        {error && (
          <div className="err" role="alert">
            {error}
          </div>
        )}
        <button className="btn primary" type="submit" disabled={busy}>
          Увійти
        </button>
      </form>
    </div>
  );
}
