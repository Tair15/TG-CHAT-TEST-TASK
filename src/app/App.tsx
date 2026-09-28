import { useAuth } from '../features/auth/useAuth';
import Login from '../features/auth/Login';
import ChatApp from './ChatApp';

export default function App() {
  const { creds, notice, login, logout, dismissNotice } = useAuth();

  if (!creds) return <Login onLogin={login} />;

  // key по инстансу: смена аккаунта пересоздаёт состояние чатов и цикл приёма.
  return (
    <ChatApp
      key={creds.idInstance}
      creds={creds}
      notice={notice}
      onLogout={logout}
      onDismissNotice={dismissNotice}
    />
  );
}
