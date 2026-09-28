import { describe, it, expect } from 'vitest';
import { addMessage, markSent, setStatus } from './messages';
import type { Chats } from '../api/types';

const base: Chats = {
  '1': { chatId: '1', title: 'Иван', phone: '', messages: [], unread: 0 },
};

describe('addMessage', () => {
  it('добавляет входящее и увеличивает unread для неактивного чата', () => {
    const next = addMessage(
      base,
      '1',
      { id: 'a', text: 'hi', out: false, time: 1 },
      { isActive: false }
    );
    expect(next['1'].messages).toHaveLength(1);
    expect(next['1'].unread).toBe(1);
  });

  it('не увеличивает unread для активного чата и исходящих', () => {
    const active = addMessage(
      base,
      '1',
      { id: 'a', text: 'hi', out: false, time: 1 },
      { isActive: true }
    );
    expect(active['1'].unread).toBe(0);
    const out = addMessage(
      base,
      '1',
      { id: 'b', text: 'hi', out: true, time: 1 },
      { isActive: false }
    );
    expect(out['1'].unread).toBe(0);
  });

  it('дедуплицирует по id', () => {
    const once = addMessage(
      base,
      '1',
      { id: 'a', text: 'hi', out: false, time: 1 },
      { isActive: false }
    );
    const twice = addMessage(
      once,
      '1',
      { id: 'a', text: 'hi', out: false, time: 1 },
      { isActive: false }
    );
    expect(twice['1'].messages).toHaveLength(1);
  });

  it('создаёт новый чат с fallback-заголовком', () => {
    const next = addMessage(
      {},
      '9',
      { id: 'a', text: 'hi', out: false, time: 1 },
      { isActive: false, fallbackTitle: 'Пётр' }
    );
    expect(next['9'].title).toBe('Пётр');
  });
});

describe('markSent', () => {
  it('проставляет реальный id и статус sent', () => {
    const withLocal = addMessage(
      base,
      '1',
      { id: 'local-1', text: 'hi', out: true, time: 1, status: 'sending' },
      { isActive: true }
    );
    const next = markSent(withLocal, '1', 'local-1', 'real-1');
    expect(next['1'].messages[0].id).toBe('real-1');
    expect(next['1'].messages[0].status).toBe('sent');
  });

  it('убирает оптимистичный дубль, если эхо пришло раньше ответа', () => {
    let chats = addMessage(
      base,
      '1',
      { id: 'local-1', text: 'hi', out: true, time: 1, status: 'sending' },
      { isActive: true }
    );
    chats = addMessage(
      chats,
      '1',
      { id: 'real-1', text: 'hi', out: true, time: 2 },
      { isActive: true }
    );
    const next = markSent(chats, '1', 'local-1', 'real-1');
    expect(next['1'].messages).toHaveLength(1);
    expect(next['1'].messages[0].id).toBe('real-1');
  });
});

describe('setStatus', () => {
  it('меняет статус сообщения', () => {
    const withLocal = addMessage(
      base,
      '1',
      { id: 'x', text: 'hi', out: true, time: 1, status: 'sending' },
      { isActive: true }
    );
    const next = setStatus(withLocal, '1', 'x', 'error');
    expect(next['1'].messages[0].status).toBe('error');
  });
});
