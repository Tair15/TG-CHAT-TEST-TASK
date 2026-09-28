import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GreenApi } from '../../shared/api/greenApi';
import type { Chats, Creds, Message } from '../../shared/api/types';
import { readJson, writeJson } from '../../shared/lib/storage';
import * as chat from '../../shared/lib/messages';

const chatsKey = (idInstance: string) => `greenapi-chats-${idInstance}`;

export function useChat(api: GreenApi, creds: Creds) {
  const [chats, setChats] = useState<Chats>(() =>
    readJson<Chats>(localStorage, chatsKey(creds.idInstance), {})
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeRef = useRef(activeId);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    writeJson(localStorage, chatsKey(creds.idInstance), chats);
  }, [chats, creds.idInstance]);

  const addMessage = useCallback((rawChatId: string, msg: Message, fallbackTitle?: string) => {
    const chatId = String(rawChatId);
    setChats((prev) =>
      chat.addMessage(prev, chatId, msg, { isActive: activeRef.current === chatId, fallbackTitle })
    );
  }, []);

  const openChat = useCallback((chatId: string) => {
    setActiveId(chatId);
    setChats((prev) =>
      prev[chatId] ? { ...prev, [chatId]: { ...prev[chatId], unread: 0 } } : prev
    );
  }, []);

  const closeChat = useCallback(() => setActiveId(null), []);

  const deliver = useCallback(
    async (chatId: string, localId: string, text: string) => {
      try {
        const res = await api.sendMessage(chatId, text);
        setChats((prev) => chat.markSent(prev, chatId, localId, res?.idMessage ?? localId));
      } catch (e) {
        console.error('[GREEN-API] ошибка отправки', e);
        setChats((prev) => chat.setStatus(prev, chatId, localId, 'error'));
      }
    },
    [api]
  );

  const send = useCallback(
    (text: string) => {
      const chatId = activeRef.current;
      if (!chatId) return;
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      addMessage(chatId, { id: localId, text, out: true, time: Date.now(), status: 'sending' });
      deliver(chatId, localId, text);
    },
    [addMessage, deliver]
  );

  const retry = useCallback(
    (msg: Message) => {
      const chatId = activeRef.current;
      if (!chatId) return;
      setChats((prev) => chat.setStatus(prev, chatId, msg.id, 'sending'));
      deliver(chatId, msg.id, msg.text);
    },
    [deliver]
  );

  const createChat = useCallback(
    async (rawPhone: string) => {
      const phone = rawPhone.replace(/\D/g, '');
      if (phone.length < 10) {
        throw new Error('Введите номер в международном формате, например +7 999 123-45-67');
      }
      const existing = Object.values(chats).find((c) => c.phone === phone);
      if (existing) {
        openChat(existing.chatId);
        return;
      }
      const res = await api.checkAccount(phone);
      if (!res?.exist || !res.chatId) {
        throw new Error(
          'На этот номер нет аккаунта Telegram, или номер скрыт настройками приватности'
        );
      }
      const chatId = String(res.chatId);
      setChats((prev) => ({
        ...prev,
        [chatId]: prev[chatId]
          ? { ...prev[chatId], phone }
          : { chatId, title: res.username || `+${phone}`, phone, messages: [], unread: 0 },
      }));
      openChat(chatId);
    },
    [api, chats, openChat]
  );

  const chatList = useMemo(() => chat.sortedChats(chats), [chats]);
  const activeChat = activeId ? chats[activeId] : undefined;

  return {
    chatList,
    activeId,
    activeChat,
    addMessage,
    openChat,
    closeChat,
    createChat,
    send,
    retry,
  };
}
