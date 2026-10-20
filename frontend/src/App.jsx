import Header from './components/Header';
import EmptyState from './components/EmptyState';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { useChat } from './hooks/useChat';
import { MotionConfig } from 'framer-motion';

export default function App() {
  const chat = useChat();
  return <MotionConfig reducedMotion="user"><div className="app-shell"><Header onClear={chat.clear} sessionKey={chat.sessionKey} hasMessages={chat.messages.length > 0}/><main>{chat.messages.length ? <MessageList {...chat} onRetry={chat.retry}/> : <EmptyState key={chat.sessionKey} onSend={chat.send}/>}</main><ChatInput key={chat.sessionKey} onSend={chat.send} onStop={chat.stop} sessionKey={chat.sessionKey} loading={chat.loading} disabled={Boolean(chat.error)} limitReached={chat.limitReached}/></div></MotionConfig>;
}
