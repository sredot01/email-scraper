import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { generateInterviewPrep } from "@/lib/interview-prep.functions";
import type { InterviewPrep } from "@/lib/interview-prep.server";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Prep — AI Game Plan" },
      { name: "description", content: "Turn any interview email into a personalized study plan, practice questions, and action steps." },
    ],
  }),
  component: Index,
});

const SAMPLE_EMAILS = [
  { label: "Platform", text: `Subject: Interview — Please confirm\n\nHi Alex,\n\nGreat speaking with you! Your video interview with Acme Cloud for the Platform Engineer role is scheduled for Friday 10/30 at 3:00 PM IST and will run for 60 minutes via Microsoft Teams. Please join 10 minutes early with your camera on.\n\nWe'd like to cover: Kubernetes and container troubleshooting, Terraform modules, CI/CD pipeline design, and your experience mentoring junior engineers.\n\nPlease reply to confirm.\n\nBest regards,\nPriya Sharma` },
  { label: "Frontend", text: `Subject: Technical Interview Invite\n\nHi Jordan,\n\nWe're excited to invite you to a 45-minute technical interview for the Senior Frontend Engineer position at Pixel Labs on Monday 11/3 at 11:00 AM EST via Zoom.\n\nFocus areas: React performance, state management, accessibility, and system design for component libraries.\n\nPlease confirm.\n\nThanks,\nSam Rivera` },
];

function Index() {
  const prepFn = useServerFn(generateInterviewPrep);
  const [emailText, setEmailText] = useState("");
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InterviewPrep[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "topics" | "questions" | "plan">("overview");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("interview-prep-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

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
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 text-foreground">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-green-500" /> Free Gemini • Rate limited
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Interview Game Plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Paste an interview email. Get topics, questions, and a timed plan in seconds.
          </p>
        </header>

        <section className="rounded-3xl border bg-card/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium">Interview email</label>
            <div className="flex gap-2">
              {SAMPLE_EMAILS.map(s => (
                <button key={s.label} type="button" onClick={() => setEmailText(s.text)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-accent">{s.label}</button>
              ))}
            </div>
          </div>
          <textarea
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            rows={7}
            placeholder="Paste the full email here…"
            className="w-full resize-y rounded-2xl border bg-background p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isPending || !emailText.trim()}
              className="rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? "Generating…" : "Generate prep"}
            </button>
            {prep && (
              <button onClick={exportMd} className="rounded-full border px-4 py-2 text-sm hover:bg-accent">
                Export .md
              </button>
            )}
          </div>
          {error && <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {isPending && (
            <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Trying free models…
            </div>
          )}
        </section>

        {history.length > 0 && !prep && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Recent:</span>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setPrep(h); setActiveTab("overview"); }}
                className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent">
                {h.company || "Untitled"}
              </button>
            ))}
          </div>
        )}

        {prep && (
          <div className="mt-10">
            <div className="mb-6 flex flex-wrap gap-2 border-b pb-2">
              {(["overview", "topics", "questions", "plan"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                    activeTab === tab ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <section className="rounded-3xl border bg-card p-6 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl font-bold">{prep.company || "Interview"}</h2>
                    {prep.role && <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{prep.role}</span>}
                  </div>
                  <button onClick={() => copy(`${prep.company}\n${prep.role}\n${prep.interviewWhen}`, "Overview")} className="text-xs text-muted-foreground hover:text-foreground">Copy</button>
                </div>
                {prep.interviewWhen && <p className="mt-3 font-medium">{prep.interviewWhen}</p>}
                {prep.summary && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{prep.summary}</p>}
                {prep.notes.length > 0 && (
                  <div className="mt-5 rounded-2xl border-l-4 border-destructive bg-destructive/5 p-4">
                    <p className="text-xs font-bold uppercase text-destructive">Important</p>
                    <ul className="mt-2 list-disc pl-5 text-sm space-y-1">{prep.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                  </div>
                )}
              </section>
            )}

            {activeTab === "topics" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {prep.topics.map((t, i) => (
                  <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="font-semibold">{i + 1}. {t.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.focus}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-3">
                {prep.questions.map((q, i) => (
                  <div key={i} className="rounded-2xl border bg-card p-5">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{q.category}</span>
                    <p className="mt-2 font-medium">{q.question}</p>
                    <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Strong answer: </span>{q.whatTheyLookFor}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "plan" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{completedSteps.size}/{prep.prepPlan.length} done</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${(completedSteps.size / Math.max(prep.prepPlan.length, 1)) * 100}%` }} />
                </div>
                <ol className="space-y-3">
                  {prep.prepPlan.map((step, i) => (
                    <li key={i} className="flex gap-4 rounded-2xl border bg-card p-4">
                      <button onClick={() => toggleStep(i)}
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                          completedSteps.has(i) ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                        }`}>
                        {completedSteps.has(i) ? "✓" : i + 1}
                      </button>
                      <div className={completedSteps.has(i) ? "opacity-60 line-through" : ""}>
                        <p className="font-semibold">{step.task} <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">{step.when}</span></p>
                        <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
