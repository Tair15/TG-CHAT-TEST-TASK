import type {
  Creds,
  StateInstanceResponse,
  SettingsResponse,
  SendMessageResponse,
  CheckAccountResponse,
  MessageData,
  Notification,
} from './types';

interface RequestOptions {
  httpMethod?: string;
  body?: unknown;
  suffix?: string;
  query?: string;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class GreenApi {
  private readonly base: string;
  private readonly token: string;

  constructor({ apiUrl, idInstance, apiTokenInstance }: Creds) {
    this.base = `${apiUrl.replace(/\/+$/, '')}/waInstance${idInstance}`;
    this.token = apiTokenInstance;
  }

  private async request<T>(method: string, opts: RequestOptions = {}): Promise<T | null> {
    const { httpMethod = 'GET', body, suffix = '', query = '', signal } = opts;
    const url = `${this.base}/${method}/${this.token}${suffix}${query}`;
    const res = await fetch(url, {
      method: httpMethod,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let detail = text;
      try {
        detail = (JSON.parse(text) as { message?: string }).message || text;
      } catch {}
      throw new ApiError(`${method}: HTTP ${res.status} ${detail}`.trim(), res.status);
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  getStateInstance() {
    return this.request<StateInstanceResponse>('getStateInstance');
  }

  getSettings() {
    return this.request<SettingsResponse>('getSettings');
  }

  setSettings(settings: Record<string, unknown>) {
    return this.request('setSettings', { httpMethod: 'POST', body: settings });
  }

  checkAccount(phoneNumber: string | number) {
    return this.request<CheckAccountResponse>('checkAccount', {
      httpMethod: 'POST',
      body: { phoneNumber: Number(phoneNumber) },
    });
  }

  sendMessage(chatId: string, message: string) {
    return this.request<SendMessageResponse>('sendMessage', {
      httpMethod: 'POST',
      body: { chatId, message },
    });
  }

  receiveNotification(signal?: AbortSignal) {
    return this.request<Notification>('receiveNotification', {
      query: '?receiveTimeout=20',
      signal,
    });
  }

  deleteNotification(receiptId: number) {
    return this.request('deleteNotification', { httpMethod: 'DELETE', suffix: `/${receiptId}` });
  }
}

export function apiUrlFromId(idInstance: string): string {
  const prefix = String(idInstance).replace(/\D/g, '').slice(0, 4);
  return `https://${prefix}.api.green-api.com`;
}

export const UNIVERSAL_API_URL = 'https://api.green-api.com';

export function extractText(messageData?: MessageData | null): string | null {
  if (!messageData) return null;
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage ?? null;
    case 'extendedTextMessage':
      return messageData.extendedTextMessageData?.text ?? null;
    default:
      return null;
  }
}
