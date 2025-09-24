import { FormEvent, useState } from 'react';
import { ApiError, login } from '../lib/api';

const AdminPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      setError('請輸入帳號與密碼。');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await login({ username, password });
      setToken(response.token);
    } catch (err) {
      setToken(null);

      if (err instanceof ApiError && err.status === 401) {
        setError('登入失敗，請確認帳號或密碼。');
      } else {
        setError('登入過程發生錯誤，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (token) {
    return (
      <section className="page">
        <h1>管理後台</h1>
        <p>新增/編輯/刪除產品</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>管理員登入</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>帳號</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="form-field">
          <span>密碼</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '登入中…' : '登入'}
        </button>
      </form>
    </section>
  );
};

export default AdminPage;
