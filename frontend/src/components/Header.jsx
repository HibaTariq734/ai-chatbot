import { Sprout, Plus, ArrowUpRight, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ onClear, sessionKey, hasMessages }) {
  return (
    <header className="header">
      <a href="/" className="brand" aria-label="Grove AI home">
        <span className="brand-icon"><Sprout size={23} /></span>
        <span>grove<span className="brand-ai"> ai</span><small>A little space to think.</small></span>
      </a>
      <div className="header-actions">
        <span className="session-pill" role="status"><Leaf size={13} />{sessionKey > 0 && !hasMessages ? 'Fresh chat ready' : 'A fresh perspective'}</span>
        <a className="docs-link" href="https://console.groq.com/docs" target="_blank" rel="noreferrer">Powered by Groq <ArrowUpRight size={14} /></a>
        <motion.button type="button" whileTap={{ scale: 0.96 }} className="clear-button" onClick={onClear} aria-label="Clear chat and start a new conversation" title="Start a new conversation">
          <Plus size={17} /><span>New chat</span>
        </motion.button>
      </div>
    </header>
  );
}
