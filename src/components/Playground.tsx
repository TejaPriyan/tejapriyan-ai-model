import { motion } from "framer-motion";
import ChatDemo from "./ChatDemo";
import SqlLab from "./SqlLab";
import { SectionHeading } from "./ui";
import { Database, MessageSquareCode } from "lucide-react";

export default function Playground() {
  return (
    <section id="playground" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          index="03"
          label="The Playground"
          title="Don't take my word for it."
          serif="Test it."
        />

        <p className="-mt-8 mb-14 max-w-2xl text-[15px] leading-relaxed text-mute">
          Test Tejapriyan's identity and conversational memory in the chatbot below, or run real schema queries in the
          in-browser SQLite execution sandbox.
        </p>

        {/* 1. Model Chatbot with Multi-Turn Memory */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-amber uppercase font-semibold">
              <MessageSquareCode size={14} className="text-amber" />
              <span>Tejapriyan Conversational Model · In-Browser Chatbot</span>
            </div>
            <span className="font-mono text-[10px] text-faint">
              Streams local Ollama weights when active · In-browser fallback
            </span>
          </div>
          <ChatDemo />
        </motion.div>

        {/* 2. Interactive SQL Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-amber uppercase font-semibold">
              <Database size={14} className="text-amber" />
              <span>Interactive SQL Sandbox · 3 Switchable Datasets</span>
            </div>
            <span className="font-mono text-[10px] text-faint">
              WASM SQLite engine · Live execution verification
            </span>
          </div>
          <SqlLab />
        </motion.div>
      </div>
    </section>
  );
}
