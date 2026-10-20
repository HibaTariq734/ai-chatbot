import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import { Sprout, User } from 'lucide-react';
import CopyButton from './CopyButton';
import TypingIndicator from './TypingIndicator';

Object.entries({ javascript, js: javascript, python, py: python, jsx, bash, shell: bash, json, css }).forEach(([name, language]) => SyntaxHighlighter.registerLanguage(name, language));

function CodeBlock({ children }) {
  // ReactMarkdown gives fenced blocks a <pre><code> tree, including a language class.
  const code = children?.props ? String(children.props.children).replace(/\n$/, '') : String(children);
  const language = /language-([\w-]+)/.exec(children?.props?.className || '')?.[1] || 'text';
  return <div className="code-block"><div className="code-toolbar"><span>{language}</span><CopyButton text={code} label="Copy code" /></div><SyntaxHighlighter language={language} useInlineStyles={false} PreTag="div" wrapLongLines={false}>{code}</SyntaxHighlighter></div>;
}

export default function MessageBubble({ message, loading }) {
  const assistant = message.role === 'assistant';
  if (assistant && !message.content && !loading) return null;
  return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className={`message ${assistant ? 'assistant' : 'user'}`}><div className="avatar">{assistant ? <Sprout size={17}/> : <User size={17}/>}</div><div className="message-body"><div className="message-label">{assistant ? 'GROVE' : 'YOU'}{assistant && <span>AI</span>}</div>{assistant ? !message.content && loading ? <TypingIndicator/> : <div className="markdown"><ReactMarkdown components={{ pre: CodeBlock, a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>{message.content || 'No reply received.'}</ReactMarkdown>{!loading && <CopyButton text={message.content} label="Copy answer" className="copy-answer" />}</div> : <p className="user-text">{message.content}</p>}</div></motion.article>;
}
