import { useEffect, useRef, useState } from 'react';
import type { GreenApi } from '../../shared/api/greenApi';
import { ApiError, extractText } from '../../shared/api/greenApi';
import type { Message, NotificationBody } from '../../shared/api/types';

export interface ReceiveState {
  state: 'ok' | 'error';
  error: string;
}

type AddMessage = (chatId: string, msg: Message, title?: string) => void;

const waitOnline = () =>
  navigator.onLine
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const on = () => {
          window.removeEventListener('online', on);
          resolve();
        };
        window.addEventListener('online', on);
      });

export function useReceiveLoop(api: GreenApi, addMessage: AddMessage) {
  const [receive, setReceive] = useState<ReceiveState>({ state: 'ok', error: '' });
  const addRef = useRef(addMessage);
  useEffect(() => {
    addRef.current = addMessage;
  }, [addMessage]);

  useEffect(() => {
    const client = api;
    const controller = new AbortController();
    let stopped = false;
    let backoff = 1000;

    void (async () => {
      while (!stopped) {
        await waitOnline();
        if (stopped) return;
        try {
          const n = await client.receiveNotification(controller.signal);
          setReceive({ state: 'ok', error: '' });
          backoff = 1000;
          if (!n) continue;
          try {
            handleNotification(n.body);
          } finally {
            await client.deleteNotification(n.receiptId);
          }
        } catch (e) {
          if (stopped || (e as Error).name === 'AbortError') return;
          // 408 при long polling — за окно ожидания ничего не пришло, это не ошибка
          if (e instanceof ApiError && e.status === 408) {
            setReceive({ state: 'ok', error: '' });
            backoff = 1000;
            continue;
          }
          console.error('[GREEN-API] ошибка получения', e);
          setReceive({ state: 'error', error: (e as Error).message });
          await new Promise((r) => setTimeout(r, backoff));
          backoff = Math.min(backoff * 2, 30000);
        }
      }
    })();

    function handleNotification(body: NotificationBody) {
      if (!body) return;
      const text = extractText(body.messageData);
      if (text == null) return;
      const { chatId, senderName, chatName } = body.senderData;
      if (body.typeWebhook === 'incomingMessageReceived') {
        addRef.current(
          chatId,
          { id: body.idMessage, text, out: false, time: body.timestamp * 1000 },
          chatName || senderName
        );
      } else if (body.typeWebhook === 'outgoingMessageReceived') {
        addRef.current(
          chatId,
          { id: body.idMessage, text, out: true, time: body.timestamp * 1000 },
          chatName
        );
      }
    }

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [api]);

  return receive;
}
