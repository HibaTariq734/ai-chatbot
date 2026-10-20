import { useCallback, useEffect, useRef, useState } from 'react';

// Development uses Vite's same-origin proxy, avoiding localhost/CORS differences.
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8000')).replace(/\/$/, '');

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionKey, setSessionKey] = useState(0);
  const controller = useRef(null);
  const lastHistory = useRef(null);
  const busy = useRef(false);

  useEffect(() => () => controller.current?.abort(), []);

  const request = useCallback(async (history) => {
    // A ref closes the gap before React renders, preventing duplicate submissions.
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    lastHistory.current = history;
    const abort = new AbortController();
    controller.current = abort;
    const id = crypto.randomUUID();
    setMessages([...history, { id, role: 'assistant', content: '' }]);
    let timer;
    const resetTimeout = () => { clearTimeout(timer); timer = setTimeout(() => abort.abort('timeout'), 45000); };
    resetTimeout();
    try {
      const response = await fetch(`${API}/api/chat/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: abort.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'The server could not process your request. Please retry.');
      }
      if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('The server returned an unexpected response. Please retry.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', finished = false, reply = '';
      try {
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          resetTimeout();
          // A network chunk can split a JSON event or even a UTF-8 character.
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
            if (!data) continue;
            const event = JSON.parse(data);
            if (event.error) throw new Error(event.error);
            if (event.content) {
              reply += event.content;
              setMessages(current => current.map(message => message.id === id ? { ...message, content: reply } : message));
            }
            if (event.done) { finished = true; break; }
          }
        }
        if (!finished) throw new Error('The connection ended early. Please retry your message.');
        if (!reply.trim()) throw new Error('The assistant returned an empty reply. Please retry.');
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    } catch (err) {
      if (controller.current !== abort) return;
      setError(abort.signal.aborted ? abort.signal.reason === 'stopped' ? 'Reply stopped. Retry to generate this answer again, or start a new chat.' : 'The reply took too long. Please try again.' : err instanceof TypeError ? 'Cannot reach the server. Check your connection and make sure Django is running.' : err.message || 'Something went wrong. Please retry.');
    } finally {
      clearTimeout(timer);
      if (controller.current === abort) { busy.current = false; setLoading(false); }
    }
  }, []);

  const send = useCallback((text) => {
    const content = text.trim();
    if (!content || content.length > 4000 || busy.current || error) return;
    // Never silently discard memory: the API accepts at most 20 messages.
    if (messages.length + 1 > 20 || messages.some(message => message.content.length > 4000)) return;
    request([...messages, { id: crypto.randomUUID(), role: 'user', content }]);
  }, [messages, error, request]);

  const clear = () => {
    controller.current?.abort(); controller.current = null; busy.current = false;
    setMessages([]); setError(''); setLoading(false); lastHistory.current = null;
    setSessionKey(current => current + 1);
  };
  const stop = () => controller.current?.abort('stopped');
  const retry = () => { if (lastHistory.current) request(lastHistory.current); };
  return { messages, loading, error, send, clear, stop, retry, sessionKey, limitReached: messages.length >= 20 || messages.some(message => message.content.length > 4000) };
}
