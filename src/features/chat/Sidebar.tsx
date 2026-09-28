import { useState, type FormEvent } from 'react';
import Avatar from '../../shared/ui/Avatar';
import { fmtTime } from '../../shared/lib/format';
import type { Chat } from '../../shared/api/types';
import type { ReceiveState } from './useReceiveLoop';

interface SidebarProps {
  chats: Chat[];
  activeId: string | null;
  onOpen: (chatId: string) => void;
  onCreate: (phone: string) => Promise<void>;
  onLogout: () => void;
  idInstance: string;
  receive: ReceiveState;
  notice: string;
  onDismissNotice: () => void;
}

export default function Sidebar({
  chats,
  activeId,
  onOpen,
  onCreate,
  onLogout,
  idInstance,
  receive,
  notice,
  onDismissNotice,
}: SidebarProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onCreate(phone);
      setPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <form className="new-chat" onSubmit={submit}>
          <input
            placeholder="Номер телефона, +7…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            aria-label="Номер телефона получателя"
          />
          <button
            className="icon-btn"
            disabled={loading || !phone}
            title="Создать чат"
            aria-label="Создать чат"
          >
            {loading ? '…' : '+'}
          </button>
        </form>
        {error && <p className="error small">{error}</p>}
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button className="link-btn" onClick={onDismissNotice}>
              Понятно
            </button>
          </div>
        )}
        {receive.state === 'error' && (
          <p className="error small" role="alert">
            Не получается загрузить входящие: {receive.error}. Пробуем снова…
          </p>
        )}
      </header>

      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="empty-list">Введите номер получателя, чтобы начать чат</li>
        )}
        {chats.map((c) => {
          const last = c.messages.at(-1);
          return (
            <li key={c.chatId}>
              <button
                className={`chat-item ${c.chatId === activeId ? 'active' : ''}`}
                onClick={() => onOpen(c.chatId)}
              >
                <Avatar title={c.title} />
                <div className="chat-item-body">
                  <div className="row">
                    <span className="title">{c.title}</span>
                    <span className="time">{fmtTime(last?.time)}</span>
                  </div>
                  <div className="row">
                    <span className="preview">
                      {last ? (last.out ? 'Вы: ' : '') + last.text : 'Нет сообщений'}
                    </span>
                    {c.unread > 0 && <span className="badge">{c.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="sidebar-foot">
        <span className="muted">
          <span className={`dot ${receive.state}`} aria-hidden="true" />
          Инстанс {idInstance}
        </span>
        <button className="link-btn" onClick={onLogout}>
          Выйти
        </button>
      </footer>
    </aside>
  );
}
