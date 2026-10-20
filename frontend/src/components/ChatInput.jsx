import { useEffect, useRef, useState } from 'react';
import { ArrowUp, CornerDownLeft, Square, Sparkles, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatInput({ onSend, onStop, loading, disabled, limitReached, sessionKey }) {
  const [value, setValue] = useState('');
  const textarea = useRef(null);

  useEffect(() => {
    textarea.current.style.height = 'auto';
    textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 160)}px`;
  }, [value]);

  // New chat resets the draft too; finishing a reply returns keyboard focus.
  useEffect(() => { setValue(''); }, [sessionKey]);
  useEffect(() => {
    // Avoid opening the mobile keyboard on initial load or after every answer.
    if (!loading && !disabled && !limitReached && window.matchMedia('(pointer: fine)').matches) {
      textarea.current?.focus({ preventScroll: true });
    }
  }, [loading, disabled, limitReached, sessionKey]);

  function submit(event) {
    event.preventDefault();
    if (!value.trim() || loading || disabled || limitReached) return;
    onSend(value);
    setValue('');
  }

  return (
    <div className="composer-wrap">
      <form onSubmit={submit} className={`composer ${loading ? 'is-generating' : ''}`}>
        <span className="input-spark" aria-hidden="true"><Sparkles size={19} strokeWidth={1.5} /></span>
        <label className="sr-only" htmlFor="message">Message the assistant</label>
        <textarea id="message" ref={textarea} rows={1} value={value} maxLength={4000} disabled={disabled || limitReached}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event); }}
          placeholder={limitReached ? 'A fresh start? Tap New chat above.' : disabled ? 'Retry your reply, or start a fresh chat.' : loading ? 'Let the ideas flow. You can draft your next question.' : 'What is on your mind?'} />
        {loading ? (
          <motion.button whileTap={{ scale: 0.94 }} type="button" className="send-button stop-button" onClick={onStop} aria-label="Stop generating" title="Stop generating"><Square size={15} fill="currentColor" /></motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.94 }} className="send-button" type="submit" aria-label="Send message" title="Send message (Enter)" disabled={disabled || limitReached || !value.trim()}><ArrowUp size={22} /></motion.button>
        )}
        <div className="composer-meta">
          <span className="composer-model"><span className="status-dot" />{loading ? 'Putting thoughts together' : 'GPT-OSS 20B'}<span className="composer-divider">/</span><span>{value.length ? `${value.length.toLocaleString()} / 4,000` : 'Powered by Groq'}</span></span>
          <span className="keyboard-hint"><kbd><CornerDownLeft size={11} /></kbd> Send <span className="shift-hint"> / Shift + Enter for a new line</span></span>
        </div>
      </form>
      <div className="footer-note"><span>Thoughtful answers. Human judgment. AI can make mistakes.</span><span className="session-note"><LockKeyhole size={11} /> Chat stays in this tab</span></div>
    </div>
  );
}
