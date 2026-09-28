import { useMemo } from 'react';
import { GreenApi } from '../shared/api/greenApi';
import { useChat } from '../features/chat/useChat';
import { useReceiveLoop } from '../features/chat/useReceiveLoop';
import Sidebar from '../features/chat/Sidebar';
import ChatWindow from '../features/chat/ChatWindow';
import type { Creds } from '../shared/api/types';

interface ChatAppProps {
  creds: Creds;
  notice: string;
  onLogout: () => void;
  onDismissNotice: () => void;
}

export default function ChatApp({ creds, notice, onLogout, onDismissNotice }: ChatAppProps) {
  const api = useMemo(() => new GreenApi(creds), [creds]);
  const chat = useChat(api, creds);
  const receive = useReceiveLoop(api, chat.addMessage);

  return (
    <div className={`app ${chat.activeId ? 'has-active' : ''}`}>
      <Sidebar
        chats={chat.chatList}
        activeId={chat.activeId}
        onOpen={chat.openChat}
        onCreate={chat.createChat}
        onLogout={onLogout}
        idInstance={creds.idInstance}
        receive={receive}
        notice={notice}
        onDismissNotice={onDismissNotice}
      />
      <ChatWindow
        chat={chat.activeChat}
        onSend={chat.send}
        onRetry={chat.retry}
        onBack={chat.closeChat}
      />
    </div>
  );
}
