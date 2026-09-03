import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  BadgeCheck,
  CheckCircle2,
  CornerDownRight,
  Database,
  Edit3,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
  XOctagon,
} from "lucide-react";
import initSqlJs, { type Database as SqlDatabase, type QueryExecResult, type SqlValue } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { DATASETS, type Dataset, type SqlPreset } from "@/data/sqlData";
import { cn } from "@/utils/cn";

/* ---------------- tiny SQL highlighter ---------------- */

const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "ON", "GROUP", "BY", "ORDER", "HAVING",
  "LIMIT", "AS", "DESC", "ASC", "COUNT", "SUM", "DISTINCT", "IN", "IS", "NULL", "NOT", "AND", "OR", "ROUND",
]);

function highlightSql(sql: string): ReactNode[] {
  return sql.split(/(\s+|[(),;<>*=]|'[^']*')/g).map((tok, i) => {
    if (!tok) return null;
    if (KEYWORDS.has(tok.toUpperCase()) && /^[A-Za-z]+$/.test(tok))
      return <span key={i} className="text-amber">{tok}</span>;
    if (/^'.*'$/.test(tok)) return <span key={i} className="text-mint">{tok}</span>;
    if (/^[0-9]+(\.[0-9]+)?$/.test(tok)) return <span key={i} className="text-ember">{tok}</span>;
    return <span key={i}>{tok}</span>;
  });
}

/* ---------------- result table ---------------- */

function ResultTable({ result }: { result: QueryExecResult }) {
  const rows = result.values.slice(0, 10);
  return (
    <div className="terminal-scroll max-h-56 overflow-auto">
      <table className="w-full font-mono text-[11.5px]">
        <thead>
          <tr className="border-b border-line/70 bg-raise">
            {result.columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium tracking-wide text-amber/80">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={result.columns.length} className="px-3 py-3 text-faint italic font-mono">
                0 rows returned
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-line/40 last:border-0 hover:bg-raise/30 transition-colors">
                {r.map((v: SqlValue, j) => (
                  <td key={j} className="tnum px-3 py-1.5 text-ink/80">
                    {v === null ? <span className="text-faint">NULL</span> : String(v)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {result.values.length > 10 && (
        <div className="px-3 py-1.5 font-mono text-[10px] text-faint border-t border-line/40">
          +{result.values.length - 10} more rows
        </div>
      )}
    </div>
  );
}

/* ---------------- reward chip ---------------- */

function RewardChip({ state }: { state: "pending" | "correct" | "wrong" | "invalid" | "custom" }) {
  const map = {
    pending: { cls: "border-line text-faint", label: "awaiting exec", Icon: Loader2 },
    correct: { cls: "border-mint/40 bg-mint/10 text-mint", label: "reward +1.0 · correct", Icon: BadgeCheck },
    wrong: { cls: "border-amber/40 bg-amber/10 text-amber", label: "reward +0.1 · wrong rows", Icon: AlertOctagon },
    invalid: { cls: "border-crimson/40 bg-crimson/10 text-crimson", label: "reward −1.0 · invalid SQL", Icon: XOctagon },
    custom: { cls: "border-mint/40 bg-mint/10 text-mint", label: "custom query · executed", Icon: CheckCircle2 },
  } as const;
  const { cls, label, Icon } = map[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em]", cls)}>
      <Icon size={11} className={state === "pending" ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

/* ---------------- main ---------------- */

type Phase = "boot" | "ready" | "generating" | "executing" | "done";

type ExecOutcome =
  | { kind: "ok"; result: QueryExecResult }
  | { kind: "error"; message: string };

export default function SqlLab() {
  const [activeDataset, setActiveDataset] = useState<Dataset>(DATASETS[0]);
  const [preset, setPreset] = useState<SqlPreset>(DATASETS[0].presets[0]);
  const [phase, setPhase] = useState<Phase>("boot");
  const [typed, setTyped] = useState(DATASETS[0].presets[0].sql);
  const [outcome, setOutcome] = useState<{ teja: ExecOutcome; base: ExecOutcome } | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const dbRef = useRef<SqlDatabase | null>(null);
  const sqlJsInstance = useRef<any>(null);
  const [dbReady, setDbReady] = useState(false);
  const runId = useRef(0);

  // Initialize SQLite WASM runtime
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const buf = await fetch(wasmUrl).then((r) => r.arrayBuffer());
        return await initSqlJs({ wasmBinary: buf });
      } catch {
        return await initSqlJs({ locateFile: () => wasmUrl });
      }
    };
    boot()
      .then((SQL) => {
        if (cancelled) return;
        sqlJsInstance.current = SQL;
        const db = new SQL.Database();
        db.run(activeDataset.schemaSql);
        dbRef.current = db;
        setDbReady(true);
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("ready");
      });
    return () => {
      cancelled = true;
      dbRef.current?.close();
    };
  }, []);

  // Switch datasets
  const selectDataset = useCallback((ds: Dataset) => {
    setActiveDataset(ds);
    setPreset(ds.presets[0]);
    setTyped(ds.presets[0].sql);
    setIsEdited(false);
    setOutcome(null);

    if (sqlJsInstance.current) {
      dbRef.current?.close();
      const newDb = new sqlJsInstance.current.Database();
      newDb.run(ds.schemaSql);
      dbRef.current = newDb;
      setDbReady(true);
    }
  }, []);

  const exec = useCallback((sql: string): ExecOutcome => {
    const db = dbRef.current;
    if (!db) return { kind: "error", message: "sqlite runtime unavailable" };
    try {
      const res = db.exec(sql);
      if (res.length === 0) return { kind: "ok", result: { columns: ["(no columns)"], values: [] } };
      return { kind: "ok", result: res[0] };
    } catch (e) {
      return { kind: "error", message: e instanceof Error ? e.message : String(e) };
    }
  }, []);

  const runPreset = useCallback(
    async (p: SqlPreset) => {
      const id = ++runId.current;
      setPreset(p);
      setOutcome(null);
      setTyped("");
      setIsEdited(false);
      setPhase("generating");
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await sleep(250);
      const target = p.sql;
      for (let i = 0; i <= target.length; i += 4) {
        if (runId.current !== id) return;
        setTyped(target.slice(0, i));
        await sleep(12);
      }
      setTyped(target);
      if (runId.current !== id) return;
      setPhase("executing");
      await sleep(400);
      if (runId.current !== id) return;
      const teja = exec(p.sql);
      const base = exec(p.baseSql);
      setOutcome({ teja, base });
      setPhase("done");
    },
    [exec]
  );

  const runCustomQuery = useCallback(() => {
    const query = typed.trim();
    if (!query) return;
    setPhase("executing");
    setTimeout(() => {
      const teja = exec(query);
      const base = exec(preset.baseSql);
      setOutcome({ teja, base });
      setPhase("done");
    }, 200);
  }, [typed, exec, preset.baseSql]);

  const resetToPreset = () => {
    setTyped(preset.sql);
    setIsEdited(false);
  };

  const busy = phase === "generating";

  // Compute Tejapriyan's status cleanly (fixing the bug from the screenshot!)
  const tejaStatus = phase === "executing"
    ? "pending"
    : outcome?.teja.kind === "error"
      ? "invalid"
      : isEdited
        ? "custom"
        : "correct";

  // Compute Base Model status cleanly
  const baseStatus = phase === "executing"
    ? "pending"
    : outcome?.base.kind === "error"
      ? "invalid"
      : "wrong";

  return (
    <div className="flex flex-col gap-6">
      {/* top dataset switcher bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-panel p-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber" />
          <span className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase font-semibold">
            Select Active Database:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DATASETS.map((ds) => (
            <button
              key={ds.id}
              onClick={() => selectDataset(ds)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3.5 py-1.5 font-mono text-[11px] transition-all",
                activeDataset.id === ds.id
                  ? "border-amber bg-amber/15 text-ink shadow-[0_0_16px_rgba(242,169,59,0.15)]"
                  : "border-line text-mute hover:border-amber/40 hover:text-ink hover:bg-raise/30"
              )}
            >
              <Database size={12} className={activeDataset.id === ds.id ? "text-amber" : "text-faint"} />
              <span>{ds.name}</span>
              <span className="text-[10px] text-faint">({ds.filename})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* left: schema + presets */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                <Database size={12} className="text-amber" /> {activeDataset.filename}
              </div>
              <span className={cn("flex items-center gap-1.5 font-mono text-[10px]", dbReady ? "text-mint" : "text-amber")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", dbReady ? "bg-mint" : "animate-pulse-dot bg-amber")} />
                {dbReady ? "sqlite live" : "compiling wasm"}
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-[11.5px]">
              {activeDataset.tables.map((t) => (
                <div key={t.name} className="rounded-md border border-line/60 bg-raise px-3 py-2">
                  <div className="flex items-center gap-2 text-ink/90 font-medium">
                    <Table2 size={11} className="text-amber/70" />
                    {t.name}
                  </div>
                  <div className="mt-1 pl-5 text-[10.5px] leading-relaxed text-faint">{t.cols.join(" · ")}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-faint">
              {activeDataset.badge} · {activeDataset.summary}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="mb-3 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
              {activeDataset.name} Challenges
            </div>
            <div className="flex flex-col gap-2">
              {activeDataset.presets.map((p) => (
                <button
                  key={p.id}
                  disabled={busy}
                  onClick={() => runPreset(p)}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all disabled:opacity-60",
                    preset.id === p.id && !isEdited
                      ? "border-amber/50 bg-amber/[0.06]"
                      : "border-line/70 hover:border-amber/30 hover:bg-amber/[0.03]"
                  )}
                >
                  <span className={cn("text-[13px] leading-snug", preset.id === p.id && !isEdited ? "text-ink font-medium" : "text-mute group-hover:text-ink")}>
                    {p.question}
                  </span>
                  <CornerDownRight size={13} className={cn("shrink-0", preset.id === p.id && !isEdited ? "text-amber" : "text-faint")} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* right: generation + editable SQL + execution */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                  <span>{preset.label}</span>
                  {isEdited && (
                    <span className="rounded bg-amber/20 px-1.5 py-0.5 text-[9px] text-amber font-semibold">
                      Custom Edited
                    </span>
                  )}
                </div>
                <div className="mt-1 max-w-xl font-serif text-lg text-ink italic md:text-xl">“{preset.question}”</div>
              </div>
              <div className="flex items-center gap-2">
                {isEdited && (
                  <button
                    onClick={resetToPreset}
                    className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 font-mono text-[11px] text-mute hover:border-amber/40 hover:text-amber transition-colors"
                  >
                    <RotateCcw size={12} /> reset
                  </button>
                )}
                <button
                  onClick={() => runPreset(preset)}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 font-mono text-[11px] text-mute hover:border-amber/40 hover:text-amber transition-colors"
                >
                  <Sparkles size={12} className="text-amber" /> run model
                </button>
                <button
                  onClick={runCustomQuery}
                  disabled={busy || !typed.trim()}
                  className="flex items-center gap-2 rounded-md bg-amber px-4 py-2 font-mono text-[12px] font-semibold text-[#0a0908] transition-all hover:bg-ink hover:text-amber disabled:opacity-50"
                >
                  {phase === "executing" ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  execute SQL
                </button>
              </div>
            </div>

            {/* reasoning + editable sql editor */}
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
              <div className="border-b border-line/70 p-5 md:border-r md:border-b-0">
                <div className="mb-3 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                  <span className="text-amber">&lt;think&gt;</span> tejapriyan reasons first
                </div>
                <AnimatePresence mode="wait">
                  <motion.ul
                    key={preset.id}
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.18 } } }}
                    className="space-y-2.5"
                  >
                    {preset.think.map((t, i) => (
                      <motion.li
                        key={i}
                        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                        className="flex items-start gap-2 font-mono text-[11.5px] leading-relaxed text-mute"
                      >
                        <span className="text-amber/60">▸</span>
                        {t}
                      </motion.li>
                    ))}
                  </motion.ul>
                </AnimatePresence>
                <div className="mt-4 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                  <span className="text-amber">&lt;/think&gt;</span> commits to SQL
                </div>
              </div>

              <div className="p-5 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                    <Edit3 size={11} className="text-amber" /> editable SQL query
                  </span>
                  <span className="font-mono text-[10px] text-faint">
                    {phase === "generating" ? (
                      <span className="text-amber">streaming…</span>
                    ) : (
                      "click to edit · ctrl+enter to run"
                    )}
                  </span>
                </div>

                <div className="relative flex-1 rounded-md border border-line/60 bg-raise focus-within:border-amber/50 transition-colors">
                  {phase === "generating" ? (
                    <div className="terminal-scroll min-h-[160px] overflow-x-auto p-4 font-mono text-[12px] leading-relaxed whitespace-pre text-ink/90">
                      {highlightSql(typed)}
                      <span className="ml-0.5 inline-block h-3 w-[6px] animate-blink bg-amber" />
                    </div>
                  ) : (
                    <textarea
                      value={typed}
                      onChange={(e) => {
                        setTyped(e.target.value);
                        setIsEdited(true);
                      }}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          runCustomQuery();
                        }
                      }}
                      placeholder="Type or modify SQL query..."
                      rows={6}
                      className="w-full h-full min-h-[160px] resize-y bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-ink/95 outline-none placeholder:text-faint"
                      spellCheck={false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* execution results */}
            <AnimatePresence>
              {(phase === "executing" || phase === "done") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-line/70"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* tejapriyan execution output */}
                    <div className="border-b border-line/70 md:border-r md:border-b-0">
                      <div className="flex items-center justify-between gap-2 px-5 py-3 bg-panel">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-amber uppercase font-semibold">
                          {isEdited ? "your query output" : "tejapriyan · fine-tuned"}
                        </span>
                        <RewardChip state={tejaStatus} />
                      </div>
                      {phase === "done" && outcome?.teja.kind === "ok" && <ResultTable result={outcome.teja.result} />}
                      {phase === "done" && outcome?.teja.kind === "error" && (
                        <div className="p-4">
                          <div className="rounded-md border border-crimson/30 bg-crimson/[0.05] p-3 font-mono text-[11px] leading-relaxed text-crimson/90">
                            sqlite3.OperationalError: {outcome.teja.message}
                          </div>
                        </div>
                      )}
                      {phase === "executing" && (
                        <div className="flex h-24 items-center justify-center font-mono text-[11px] text-faint">
                          <Loader2 size={14} className="mr-2 animate-spin text-amber" /> executing in sqlite…
                        </div>
                      )}
                    </div>

                    {/* base output comparison */}
                    <div>
                      <div className="flex items-center justify-between gap-2 px-5 py-3 bg-panel">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-mute uppercase font-semibold">
                          qwen3-8b base baseline
                        </span>
                        <RewardChip state={baseStatus} />
                      </div>
                      {phase === "done" && outcome && (
                        <div className="px-5 pb-5 pt-2">
                          {outcome.base.kind === "error" ? (
                            <div className="rounded-md border border-crimson/30 bg-crimson/[0.05] p-3 font-mono text-[11px] leading-relaxed text-crimson/90">
                              sqlite3.OperationalError: {outcome.base.message}
                            </div>
                          ) : (
                            <div className="rounded-md border border-line/60">
                              <ResultTable result={outcome.base.result} />
                            </div>
                          )}
                          <p className="mt-2.5 font-mono text-[10.5px] leading-relaxed text-faint">
                            <span className="text-amber/70">base diagnosis:</span> {preset.baseNote}
                          </p>
                        </div>
                      )}
                      {phase === "executing" && (
                        <div className="flex h-24 items-center justify-center font-mono text-[11px] text-faint">
                          <Loader2 size={14} className="mr-2 animate-spin text-mute" /> executing…
                        </div>
                      )}
                    </div>
                  </div>

                  {phase === "done" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 bg-raise px-5 py-3">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                        Running on {activeDataset.name} ({activeDataset.filename}) · Edit any SQL above & hit Execute
                      </span>
                      <span className="tnum font-mono text-[11px] text-mute">
                        executed rows: <span className="text-mint">{outcome?.teja.kind === "ok" ? outcome.teja.result.values.length : 0}</span>
                        {"  ·  "}base rows:{" "}
                        <span className={outcome?.base.kind === "ok" ? "text-mute" : "text-crimson"}>
                          {outcome?.base.kind === "ok" ? outcome.base.result.values.length : "syntax error"}
                        </span>
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
