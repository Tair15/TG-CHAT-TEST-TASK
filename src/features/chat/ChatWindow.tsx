import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Avatar from '../../shared/ui/Avatar';
import { dayLabel, fmtTime, sameDay } from '../../shared/lib/format';
import type { Chat, Message, MessageStatus } from '../../shared/api/types';

function Status({ status, onRetry }: { status?: MessageStatus; onRetry: () => void }) {
  if (status === 'sending')
    return (
      <span className="tick sending" title="Отправляется" aria-label="Отправляется">
        🕓
      </span>
    );
  if (status === 'error')
    return (
      <button
        className="tick error"
        onClick={onRetry}
        title="Не отправлено — нажмите, чтобы повторить"
      >
        ⚠ повторить
      </button>
    );
  return (
    <span className="tick sent" title="Отправлено" aria-label="Отправлено">
      ✓
    </span>
  );
}

interface ChatWindowProps {
  chat?: Chat;
  onSend: (text: string) => void;
  onRetry: (msg: Message) => void;
  onBack: () => void;
}

export default function ChatWindow({ chat, onSend, onRetry, onBack }: ChatWindowProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [chat?.messages.length, chat?.chatId]);

  if (!chat) {
    return (
      <main className="chat chat-empty">
        <span className="pill">Выберите чат или создайте новый по номеру телефона</span>
      </main>
    );
  }

  const submit = () => {
    const msg = text.trim();
    if (!msg) return;
    onSend(msg);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <main className="chat">
      <header className="chat-head">
        <button className="icon-btn back" onClick={onBack} aria-label="Назад к чатам">
          ‹
        </button>
        <Avatar title={chat.title} size={42} />
        <div>
          <div className="title">{chat.title}</div>
          <div className="muted small">{chat.phone ? `+${chat.phone}` : `id ${chat.chatId}`}</div>
        </div>
      </header>

      <div className="messages" aria-live="polite">
        {chat.messages.length === 0 && <span className="pill center">Сообщений пока нет</span>}
        {chat.messages.map((m, i) => {
          const prev = chat.messages[i - 1];
          const showDate = !prev || !sameDay(prev.time, m.time);
          return (
            <Fragment key={m.id}>
              {showDate && (
                <div className="day-sep">
                  <span className="pill">{dayLabel(m.time)}</span>
                </div>
              )}
              <div
                className={`bubble ${m.out ? 'out' : 'in'} ${m.status === 'error' ? 'failed' : ''}`}
              >
                <span className="text">{m.text}</span>
                <span className="meta">
                  <span className="time-inline">{fmtTime(m.time)}</span>
                  {m.out && <Status status={m.status} onRetry={() => onRetry(m)} />}
                </span>
              </div>
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        <textarea
          rows={1}
          placeholder="Сообщение"
          value={text}
          maxLength={4096}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Текст сообщения"
        />
        <button
          className="send-btn"
          onClick={submit}
          disabled={!text.trim()}
          aria-label="Отправить"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M3.4 20.4l17.4-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.7-.3-1.4.2-1.4.9v4.6c0 .5.4.9.9 1l12.1 1.9-12.1 1.9c-.5.1-.9.5-.9 1v4.6c0 .7.7 1.2 1.4.9z"
            />
          </svg>
        </button>
      </div>
    </main>
  );
}
