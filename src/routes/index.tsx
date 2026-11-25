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
      {
        name: "description",
        content: "Turn any interview email into a personalized study plan, practice questions, and action steps.",
      },
    ],
  }),
  component: Index,
});

const SAMPLE_EMAILS = [
  {
    label: "Platform Engineer",
    text: `Subject: Interview — Please confirm\n\nHi Alex,\n\nGreat speaking with you! Your video interview with Acme Cloud for the Platform Engineer role is scheduled for Friday 10/30 at 3:00 PM IST and will run for 60 minutes via Microsoft Teams. Please join 10 minutes early with your camera on.\n\nWe'd like to cover: Kubernetes and container troubleshooting, Terraform modules, CI/CD pipeline design, and your experience mentoring junior engineers.\n\nPlease reply to confirm.\n\nBest regards,\nPriya Sharma\nTalent Partner, Acme Cloud`,
  },
  {
    label: "Frontend Role",
    text: `Subject: Technical Interview Invite\n\nHi Jordan,\n\nWe're excited to invite you to a 45-minute technical interview for the Senior Frontend Engineer position at Pixel Labs on Monday 11/3 at 11:00 AM EST via Zoom.\n\nFocus areas: React performance, state management, accessibility, and system design for component libraries.\n\nPlease confirm and share any accessibility needs.\n\nThanks,\nSam Rivera\nHiring Manager`,
  },
];

function Index() {
  const prepFn = useServerFn(generateInterviewPrep);
  const [emailText, setEmailText] = useState("");
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InterviewPrep[]>([]);

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
      const newHistory = [result, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("interview-prep-history", JSON.stringify(newHistory));
      toast.success("Prep plan generated!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  function exportMarkdown() {
    if (!prep) return;
    const md = `# Interview Prep\n\n**Company:** ${prep.company}\n**Role:** ${prep.role}\n**When:** ${prep.interviewWhen}\n\n## Summary\n${prep.summary}\n\n## Topics\n${prep.topics.map((t, i) => `${i + 1}. **${t.name}** — ${t.focus}`).join("\n")}\n\n## Questions\n${prep.questions.map((q) => `- **[${q.category}]** ${q.question}\n  *Strong answer:* ${q.whatTheyLookFor}`).join("\n\n")}\n\n## Plan\n${prep.prepPlan.map((s, i) => `${i + 1}. **${s.task}** (${s.when})\n   ${s.detail}`).join("\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-prep-${prep.company || "plan"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">AI Interview Coach</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Turn an interview email<br className="hidden sm:block" /> into a game plan
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Paste the email. Get topics, practice questions, and a time-boxed plan — powered by free Gemini.
          </p>
        </header>

        <section className="mt-10 rounded-3xl border bg-card/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="text-sm font-medium">Interview email</label>
            <div className="flex gap-2">
              {SAMPLE_EMAILS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setEmailText(s.text)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-accent"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="email"
            rows={8}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Paste the full email here…"
            className="mt-3 w-full resize-y rounded-2xl border bg-background p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || !emailText.trim()}
              className="rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? "Building your plan…" : "Generate prep"}
            </button>
            {prep && (
              <button
                type="button"
                onClick={exportMarkdown}
                className="rounded-full border px-4 py-2 text-sm hover:bg-accent"
              >
                Export Markdown
              </button>
            )}
          </div>
          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {isPending && (
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Analyzing email with free Gemini models…</span>
            </div>
          )}
        </section>

        {history.length > 0 && !prep && (
          <section className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground">Recent plans</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setPrep(h)}
                  className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent"
                >
                  {h.company || "Untitled"} — {h.role || "Role"}
                </button>
              ))}
            </div>
          </section>
        )}

        {prep && <PrepResults prep={prep} onCopy={copyToClipboard} />}
      </main>
    </div>
  );
}

function PrepResults({ prep, onCopy }: { prep: InterviewPrep; onCopy: (t: string, l: string) => void }) {
  return (
    <div className="mt-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-3xl border bg-card p-6 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">{prep.company || "Interview"}</h2>
            {prep.role && (
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {prep.role}
              </span>
            )}
          </div>
          <button
            onClick={() => onCopy(`${prep.company}\n${prep.role}\n${prep.interviewWhen}`, "Details")}
            className="rounded-full border px-3 py-1 text-xs hover:bg-accent"
          >
            Copy
          </button>
        </div>
        {prep.interviewWhen && <p className="mt-3 text-sm font-medium">{prep.interviewWhen}</p>}
        {prep.summary && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{prep.summary}</p>}
        {prep.notes.length > 0 && (
          <div className="mt-5 rounded-2xl border-l-4 border-destructive bg-destructive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-destructive">Important</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {prep.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Topics to study</h2>
          <button onClick={() => onCopy(prep.topics.map(t => `${t.name}: ${t.focus}`).join("\n"), "Topics")} className="text-xs text-muted-foreground hover:text-foreground">Copy</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {prep.topics.map((topic, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
              <p className="text-sm font-semibold">{i + 1}. {topic.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{topic.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Practice questions</h2>
          <button onClick={() => onCopy(prep.questions.map(q => `[${q.category}] ${q.question}`).join("\n"), "Questions")} className="text-xs text-muted-foreground hover:text-foreground">Copy</button>
        </div>
        <div className="mt-4 space-y-3">
          {prep.questions.map((q, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{q.category}</span>
              <p className="mt-2 text-sm font-medium leading-relaxed">{q.question}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Strong answer: </span>{q.whatTheyLookFor}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Prep plan</h2>
          <button onClick={() => onCopy(prep.prepPlan.map((s, i) => `${i+1}. ${s.task} (${s.when})`).join("\n"), "Plan")} className="text-xs text-muted-foreground hover:text-foreground">Copy</button>
        </div>
        <ol className="mt-4 space-y-4">
          {prep.prepPlan.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {step.task}{" "}
                  <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{step.when}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
