import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { generateInterviewPrep } from "@/lib/interview-prep.functions";
import type { InterviewPrep } from "@/lib/interview-prep.server";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Prep — AI Game Plan" },
      { name: "description", content: "Turn any interview email into a personalized study plan with topics, questions, and resources." },
    ],
  }),
  component: Index,
});

const SAMPLE_OPTIONS = [
  { value: "", label: "Choose a sample email…" },
  { value: "platform", label: "Platform Engineer (Acme Cloud)" },
  { value: "frontend", label: "Senior Frontend Engineer (Pixel Labs)" },
  { value: "backend", label: "Backend Engineer (DataFlow)" },
  { value: "fullstack", label: "Full Stack Engineer (Nova)" },
  { value: "devops", label: "DevOps Engineer (CloudScale)" },
];

const SAMPLE_TEXTS: Record<string, string> = {
  platform: `Subject: Interview — Please confirm\n\nHi Alex,\n\nGreat speaking with you! Your video interview with Acme Cloud for the Platform Engineer role is scheduled for Friday 10/30 at 3:00 PM IST and will run for 60 minutes via Microsoft Teams. Please join 10 minutes early with your camera on.\n\nWe'd like to cover: Kubernetes and container troubleshooting, Terraform modules, CI/CD pipeline design, and your experience mentoring junior engineers.\n\nPlease reply to confirm.\n\nBest regards,\nPriya Sharma`,
  frontend: `Subject: Technical Interview Invite\n\nHi Jordan,\n\nWe're excited to invite you to a 45-minute technical interview for the Senior Frontend Engineer position at Pixel Labs on Monday 11/3 at 11:00 AM EST via Zoom.\n\nFocus areas: React performance, state management, accessibility, and system design for component libraries.\n\nPlease confirm.\n\nThanks,\nSam Rivera`,
  backend: `Subject: Backend Interview Confirmation\n\nHi Priya,\n\nYour interview for Backend Engineer at DataFlow is set for Wednesday 11/5 at 10:00 AM PST via Google Meet (60 minutes).\n\nTopics: API design, database optimization, distributed systems, and caching strategies.\n\nPlease confirm availability.\n\nRegards,\nAlex Chen`,
  fullstack: `Subject: Full Stack Interview\n\nHi Maya,\n\nJoin us for a 90-minute full stack interview at Nova on Thursday 11/6 at 2:00 PM EST via Zoom.\n\nWe'll cover: React + Node.js architecture, database design, and end-to-end system design.\n\nConfirm when ready.\n\nBest,\nJordan Lee`,
  devops: `Subject: DevOps Interview Invite\n\nHi Sam,\n\nYour DevOps Engineer interview with CloudScale is scheduled for Friday 11/7 at 1:00 PM IST via Teams (75 minutes).\n\nFocus: Kubernetes, CI/CD, infrastructure as code, and monitoring.\n\nPlease confirm.\n\nThanks,\nPriya Nair`,
};

function CustomSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = SAMPLE_OPTIONS.find(o => o.value === value) || SAMPLE_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
      >
        <span className="max-w-[180px] truncate">{selected.label}</span>
        <svg className={`size-4 transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          {SAMPLE_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                o.value === value ? "bg-red-600 text-white" : "text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Index() {
  const prepFn = useServerFn(generateInterviewPrep);
  const [emailText, setEmailText] = useState("");
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InterviewPrep[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "topics" | "questions" | "plan">("overview");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedSample, setSelectedSample] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("interview-prep-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  function onSampleChange(value: string) {
    setSelectedSample(value);
    if (value && SAMPLE_TEXTS[value]) setEmailText(SAMPLE_TEXTS[value]);
  }

  async function handleGenerate() {
    setError(null);
    setIsPending(true);
    try {
      const result = await prepFn({ data: { emailText } });
      setPrep(result);
      setActiveTab("overview");
      setCompletedSteps(new Set());
      const newHistory = [result, ...history].slice(0, 8);
      setHistory(newHistory);
      localStorage.setItem("interview-prep-history", JSON.stringify(newHistory));
      toast.success("Prep plan ready!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  function exportMd() {
    if (!prep) return;
    const md = `# ${prep.company || "Interview"} — ${prep.role}\n\n**When:** ${prep.interviewWhen}\n\n## Summary\n${prep.summary}\n\n## Topics\n${prep.topics.map((t, i) => `${i+1}. **${t.name}** — ${t.focus}`).join("\n")}\n\n## Questions\n${prep.questions.map(q => `- **[${q.category}]** ${q.question}\n  *${q.whatTheyLookFor}*`).join("\n\n")}\n\n## Plan\n${prep.prepPlan.map((s, i) => `${i+1}. **${s.task}** (${s.when})\n   ${s.detail}`).join("\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prep-${(prep.company || "plan").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    toast.success("Exported");
  }

  function toggleStep(i: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
        toast.message("Step unmarked");
      } else {
        next.add(i);
        toast.success("Step completed!");
      }
      return next;
    });
  }

  const progressPercent = prep ? Math.round((completedSteps.size / Math.max(prep.prepPlan.length, 1)) * 100) : 0;

  function getResourceLinks(topic: string) {
    const q = encodeURIComponent(topic);
    return [
      { label: "Docs", href: `https://www.google.com/search?q=${q}+official+documentation` },
      { label: "Articles", href: `https://www.google.com/search?q=${q}+best+practices+guide` },
      { label: "YouTube", href: `https://www.youtube.com/results?search_query=${q}+tutorial` },
      { label: "Practice", href: `https://www.google.com/search?q=${q}+interview+questions+practice` },
    ];
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl text-white">
            Interview Game Plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">
            Paste an interview email. Get topics, questions, and a timed plan with helpful resources.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-zinc-300">Interview email</label>
            <CustomSelect value={selectedSample} onChange={onSampleChange} />
          </div>
          <textarea
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            rows={7}
            placeholder="Paste the full email here…"
            className="w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-red-500"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isPending || !emailText.trim()}
              className="rounded-full bg-red-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-40"
            >
              {isPending ? "Generating…" : "Generate prep"}
            </button>
            {prep && (
              <button onClick={exportMd} className="rounded-full border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                Export .md
              </button>
            )}
          </div>
          {error && <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
          {isPending && (
            <div className="mt-5 flex items-center gap-3 text-sm text-zinc-400">
              <span className="size-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              Building your plan…
            </div>
          )}
        </section>

        {history.length > 0 && !prep && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs text-zinc-500">Recent:</span>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setPrep(h); setActiveTab("overview"); }}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
                {h.company || "Untitled"}
              </button>
            ))}
          </div>
        )}

        {prep && (
          <div className="mt-10">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
              {(["overview", "topics", "questions", "plan"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                    activeTab === tab ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-white">{prep.company || "Interview"}</h2>
                    {prep.role && <span className="mt-2 inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">{prep.role}</span>}
                  </div>
                  <button onClick={() => copy(`${prep.company}\n${prep.role}\n${prep.interviewWhen}`, "Overview")} className="text-xs text-zinc-500 hover:text-zinc-300">Copy</button>
                </div>
                {prep.interviewWhen && <p className="mt-3 font-medium text-zinc-200">{prep.interviewWhen}</p>}
                {prep.summary && <p className="mt-3 text-sm leading-relaxed text-zinc-400">{prep.summary}</p>}
                {prep.notes.length > 0 && (
                  <div className="mt-5 rounded-2xl border-l-4 border-red-500 bg-red-500/10 p-4">
                    <p className="text-xs font-bold uppercase text-red-400">Important</p>
                    <ul className="mt-2 list-disc pl-5 text-sm space-y-1 text-zinc-300">{prep.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                  </div>
                )}
              </section>
            )}

            {activeTab === "topics" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {prep.topics.map((t, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="font-semibold text-white">{i + 1}. {t.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{t.focus}</p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                      {getResourceLinks(t.name).map(link => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-red-400 hover:underline"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-3">
                {prep.questions.map((q, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">{q.category}</span>
                    <p className="mt-2 font-medium text-zinc-100">{q.question}</p>
                    <p className="mt-2 text-sm text-zinc-400"><span className="font-medium text-zinc-200">Strong answer: </span>{q.whatTheyLookFor}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "plan" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Progress</span>
                  <span className="font-semibold text-red-400">{completedSteps.size}/{prep.prepPlan.length} done • {progressPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-red-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <ol className="space-y-3">
                  {prep.prepPlan.map((step, i) => {
                    const done = completedSteps.has(i);
                    return (
                      <li key={i} className={`flex gap-4 rounded-2xl border bg-zinc-900 p-4 transition ${
                        done ? "border-green-500/40" : "border-zinc-800"
                      }`}>
                        <button
                          onClick={() => toggleStep(i)}
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            done ? "bg-green-500 text-white scale-105" : "bg-red-600 text-white hover:scale-105"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </button>
                        <div className={done ? "opacity-60" : ""}>
                          <p className={`font-semibold ${done ? "line-through text-zinc-400" : "text-zinc-100"}`}>
                            {step.task}{" "}
                            <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{step.when}</span>
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">{step.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
