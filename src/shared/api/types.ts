export interface Creds {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Message {
  id: string;
  text: string;
  out: boolean;
  time: number;
  status?: MessageStatus;
}

export interface Chat {
  chatId: string;
  title: string;
  phone: string;
  messages: Message[];
  unread: number;
}

export type Chats = Record<string, Chat>;

export interface StateInstanceResponse {
  stateInstance: string;
}

export interface SettingsResponse {
  incomingWebhook?: string;
  webhookUrl?: string;
  [key: string]: unknown;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
  username?: string;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
}

export interface NotificationBody {
  typeWebhook: string;
  idMessage: string;
  timestamp: number;
  senderData: { chatId: string; senderName?: string; chatName?: string };
  messageData?: MessageData;
}

export interface Notification {
  receiptId: number;
  body: NotificationBody;
}
