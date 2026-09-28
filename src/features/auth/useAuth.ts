import { useCallback, useState } from 'react';
import { ApiError, GreenApi, apiUrlFromId, UNIVERSAL_API_URL } from '../../shared/api/greenApi';
import { readJson, writeJson } from '../../shared/lib/storage';
import type { Creds, StateInstanceResponse } from '../../shared/api/types';

const CREDS_KEY = 'greenapi-creds';

export interface LoginInput {
  idInstance: string;
  apiTokenInstance: string;
}

export function useAuth() {
  const [creds, setCreds] = useState<Creds | null>(() =>
    readJson<Creds | null>(sessionStorage, CREDS_KEY, null)
  );
  const [notice, setNotice] = useState('');

  const login = useCallback(async ({ idInstance, apiTokenInstance }: LoginInput) => {
    // Хост определяется по idInstance; при сетевой ошибке — универсальный хост.
    const hosts = [apiUrlFromId(idInstance), UNIVERSAL_API_URL];
    let chosen: Creds | null = null;
    let state: StateInstanceResponse | null = null;
    let lastError: unknown = null;
    for (const apiUrl of hosts) {
      const candidate: Creds = { apiUrl, idInstance, apiTokenInstance };
      try {
        state = await new GreenApi(candidate).getStateInstance();
        chosen = candidate;
        break;
      } catch (e) {
        lastError = e;
        if (e instanceof ApiError && e.status) throw e;
      }
    }
    if (!chosen) throw lastError;

    if (state?.stateInstance !== 'authorized') {
      throw new Error(
        `Инстанс не авторизован (состояние: ${state?.stateInstance ?? 'неизвестно'}). Привяжите Telegram-аккаунт в личном кабинете GREEN-API.`
      );
    }

    const client = new GreenApi(chosen);
    const settings = await client.getSettings();
    if (settings && (settings.incomingWebhook !== 'yes' || settings.webhookUrl)) {
      await client.setSettings({ webhookUrl: '', incomingWebhook: 'yes' });
      setNotice(
        'Включили получение входящих сообщений в настройках инстанса. GREEN-API применяет настройки до 5 минут, после этого ответы начнут приходить.'
      );
    }

    writeJson(sessionStorage, CREDS_KEY, chosen);
    setCreds(chosen);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(CREDS_KEY);
    setCreds(null);
    setNotice('');
  }, []);

  const dismissNotice = useCallback(() => setNotice(''), []);

  return { creds, notice, login, logout, dismissNotice };
}
