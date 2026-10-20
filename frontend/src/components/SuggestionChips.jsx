import { Code2, FileCode2, Lightbulb, Workflow, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const suggestions = [
  [Code2, 'Make code click', 'Explain React hooks', '01'],
  [FileCode2, 'Build a little magic', 'Write a Python script to rename files', '02'],
  [Lightbulb, 'Find your next move', 'Give me a freelancing tip', '03'],
  [Workflow, 'Untangle an idea', 'Explain APIs simply', '04'],
];

export default function SuggestionChips({ onSend }) {
  return (
    <div className="suggestion-grid">
      {suggestions.map(([Icon, label, prompt, number]) => (
        <motion.button key={prompt} whileTap={{ scale: 0.98 }} onClick={() => onSend(prompt)} className="suggestion" aria-label={prompt}>
          <div className="suggestion-top"><span className="suggestion-icon"><Icon size={19} strokeWidth={1.6} /></span><span className="suggestion-number">{number}</span></div>
          <span className="suggestion-label">{label}</span>
          <span className="suggestion-bottom"><span className="suggestion-prompt">{prompt}</span><ArrowUpRight size={16} /></span>
        </motion.button>
      ))}
    </div>
  );
}
