import { Sparkles, Sprout, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import SuggestionChips from './SuggestionChips';

export default function EmptyState({ onSend }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="empty-state">
      <div className="eyebrow"><span className="status-dot" /> LESS NOISE. MORE POSSIBILITY.</div>
      <div className="hero-icon"><Sprout size={34} strokeWidth={1.4} /><span className="hero-spark"><Sparkles size={14} /></span></div>
      <h1>Good ideas need a little<br /><em>room to grow.</em></h1>
      <p>A thoughtful companion for your code, your curiosity,<br className="desktop-break" /> and whatever comes next.</p>
      <div className="suggestion-heading"><span>A FEW SEEDS TO GET STARTED</span><ArrowDown size={13} /></div>
      <SuggestionChips onSend={onSend} />
      <div className="empty-caption"><span className="caption-line" /> Your next great idea can start with a simple question.<span className="caption-line" /></div>
    </motion.section>
  );
}
