import { describe, it, expect } from 'vitest';
import { apiUrlFromId, extractText } from './greenApi';

describe('apiUrlFromId', () => {
  it('строит поддомен из первых 4 цифр idInstance', () => {
    expect(apiUrlFromId('1101123456')).toBe('https://1101.api.green-api.com');
    expect(apiUrlFromId('7103999999')).toBe('https://7103.api.green-api.com');
  });

  it('игнорирует нецифровые символы', () => {
    expect(apiUrlFromId(' 4100-000 ')).toBe('https://4100.api.green-api.com');
  });
});

describe('extractText', () => {
  it('достаёт текст из обычного сообщения', () => {
    expect(
      extractText({ typeMessage: 'textMessage', textMessageData: { textMessage: 'привет' } })
    ).toBe('привет');
  });

  it('достаёт текст из extendedTextMessage', () => {
    expect(
      extractText({
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'см. ссылку' },
      })
    ).toBe('см. ссылку');
  });

  it('возвращает null для нетекстовых типов и пустых данных', () => {
    expect(extractText({ typeMessage: 'imageMessage' })).toBeNull();
    expect(extractText(null)).toBeNull();
  });
});
