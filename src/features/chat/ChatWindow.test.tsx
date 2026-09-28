import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWindow from './ChatWindow';
import type { Chat } from '../../shared/api/types';

const chat: Chat = { chatId: '1', title: 'Иван', phone: '79990000000', messages: [], unread: 0 };

describe('ChatWindow', () => {
  it('показывает подсказку без выбранного чата', () => {
    render(<ChatWindow chat={undefined} onSend={() => {}} onRetry={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/Выберите чат/)).toBeInTheDocument();
  });

  it('отправляет текст и очищает поле', async () => {
    const onSend = vi.fn();
    render(<ChatWindow chat={chat} onSend={onSend} onRetry={() => {}} onBack={() => {}} />);
    const input = screen.getByLabelText('Текст сообщения');
    await userEvent.type(input, 'привет');
    await userEvent.click(screen.getByLabelText('Отправить'));
    expect(onSend).toHaveBeenCalledWith('привет');
    expect(input).toHaveValue('');
  });
});
