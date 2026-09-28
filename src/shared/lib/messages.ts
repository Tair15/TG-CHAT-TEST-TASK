import type { Chat, Chats, Message, MessageStatus } from '../api/types';

function ensureChat(chats: Chats, chatId: string, fallbackTitle?: string): Chat {
  return (
    chats[chatId] ?? {
      chatId,
      title: fallbackTitle || chatId,
      phone: '',
      messages: [],
      unread: 0,
    }
  );
}

export function addMessage(
  chats: Chats,
  chatId: string,
  msg: Message,
  opts: { isActive: boolean; fallbackTitle?: string }
): Chats {
  const chat = ensureChat(chats, chatId, opts.fallbackTitle);
  if (chat.messages.some((m) => m.id === msg.id)) return chats;
  const unread = msg.out || opts.isActive ? chat.unread : chat.unread + 1;
  return { ...chats, [chatId]: { ...chat, messages: [...chat.messages, msg], unread } };
}

export function setStatus(chats: Chats, chatId: string, id: string, status: MessageStatus): Chats {
  const chat = chats[chatId];
  if (!chat) return chats;
  return {
    ...chats,
    [chatId]: { ...chat, messages: chat.messages.map((m) => (m.id === id ? { ...m, status } : m)) },
  };
}

// Оптимистичное сообщение получило реальный idMessage.
// Если эхо-уведомление с этим id уже пришло раньше ответа SendMessage — убираем дубль.
export function markSent(chats: Chats, chatId: string, localId: string, realId: string): Chats {
  const chat = chats[chatId];
  if (!chat) return chats;
  const already = chat.messages.some((m) => m.id === realId);
  const messages = already
    ? chat.messages.filter((m) => m.id !== localId)
    : chat.messages.map((m) =>
        m.id === localId ? { ...m, id: realId, status: 'sent' as const } : m
      );
  return { ...chats, [chatId]: { ...chat, messages } };
}

export function sortedChats(chats: Chats): Chat[] {
  return Object.values(chats).sort(
    (a, b) => (b.messages.at(-1)?.time || 0) - (a.messages.at(-1)?.time || 0)
  );
}
