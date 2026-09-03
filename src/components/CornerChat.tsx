import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronDown, Sparkles, X } from "lucide-react";
import ChatDemo from "./ChatDemo";
import { LogoMark } from "./ui";

export default function CornerChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating launcher button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 rounded-full border border-amber/40 bg-panel/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(242,169,59,0.18)] backdrop-blur-md transition-all hover:border-amber hover:shadow-[0_8px_35px_rgba(242,169,59,0.28)]"
          aria-label="Open AI Chatbot"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-amber/50 bg-[#161109] text-amber">
            <LogoMark className="h-3.5 w-3.5 text-amber" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-mint animate-pulse" />
          </div>
          <span className="font-mono text-xs font-semibold text-ink">
            {open ? "Close Chatbot" : "AI Chatbot"}
          </span>
          {open ? <X size={14} className="text-mute" /> : <Sparkles size={13} className="text-amber" />}
        </motion.button>
      </div>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-6 z-50 w-[92vw] max-w-md shadow-2xl rounded-xl border border-amber/35 bg-panel/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-line/80 px-4 py-2.5 bg-raise">
              <div className="flex items-center gap-2">
                <Bot size={15} className="text-amber" />
                <span className="font-mono text-xs font-semibold text-ink">Tejapriyan AI Model</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-faint hover:text-ink transition-colors p-1"
                aria-label="Close"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="p-3">
              <ChatDemo />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
