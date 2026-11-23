import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateInterviewPrep } from "@/lib/interview-prep.functions";
import type { InterviewPrep } from "@/lib/interview-prep.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Prep — tailored questions & study plan" },
      {
        name: "description",
        content:
          "Paste an interview email and get AI-tailored practice questions, topics to study, and a time-boxed preparation plan.",
      },
    ],
  }),
  component: Index,
});

const SAMPLE_EMAIL = `Subject: Interview — Please confirm

Hi Alex,

Great speaking with you! Your video interview with Acme Cloud for the Platform Engineer role is scheduled for Friday 10/30 at 3:00 PM IST and will run for 60 minutes via Microsoft Teams. Please join 10 minutes early with your camera on.

We'd like to cover: Kubernetes and container troubleshooting, Terraform modules, CI/CD pipeline design, and your experience mentoring junior engineers. Come prepared to walk through a pipeline you have built and to troubleshoot a failing deployment live.

Please reply to confirm you can make it.

Best regards,
Priya Sharma
Talent Partner, Acme Cloud`;

function Index() {
  const prepFn = useServerFn(generateInterviewPrep);
  const [emailText, setEmailText] = useState("");
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setPrep(null);
    setIsPending(true);
    try {
      const result = await prepFn({ data: { emailText } });
      setPrep(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            AI-powered interview prep
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn an interview email into a game plan
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Paste the email you received about an upcoming interview. You'll get the key
            details, the topics to study, tailored practice questions, and a plan for the
            hours you have left.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border bg-card p-6 shadow-sm">
          <label htmlFor="email" className="block text-sm font-medium">
            Interview email
          </label>
          <textarea
            id="email"
            rows={10}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Paste the full email here — subject, body, everything…"
            className="mt-2 w-full resize-y rounded-xl border bg-background p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || emailText.trim().length === 0}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? "Generating…" : "Generate prep"}
            </button>
            <button
              type="button"
              onClick={() => setEmailText(SAMPLE_EMAIL)}
              disabled={isPending}
              className="rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-40"
            >
              Try a sample email
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Analyzed on the server, never stored. Verify details against the original email.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {isPending && (
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span className="animate-pulse">Reading your email and building your prep plan…</span>
            </div>
          )}
        </section>

        {prep && <PrepResults prep={prep} />}
      </main>
    </div>
  );
}

function PrepResults({ prep }: { prep: InterviewPrep }) {
  return (
    <div className="mt-12 space-y-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight">{prep.company || "Interview"}</h2>
          {prep.role && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {prep.role}
            </span>
          )}
        </div>
        {prep.interviewWhen && <p className="mt-2 text-sm font-medium">{prep.interviewWhen}</p>}
        {prep.summary && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{prep.summary}</p>}
        {prep.notes && prep.notes.length > 0 && (
          <div className="mt-5 rounded-xl border-l-4 border-destructive bg-destructive/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Important from the email</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {prep.notes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Topics to study</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {prep.topics.map((topic, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold">{i + 1}. {topic.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{topic.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Practice questions</h2>
        <div className="mt-4 space-y-3">
          {prep.questions.map((q, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {q.category}
              </span>
              <p className="mt-2 text-sm font-medium leading-relaxed">{q.question}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">What a strong answer shows: </span>
                {q.whatTheyLookFor}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Prep plan</h2>
        <ol className="mt-4 space-y-4">
          {prep.prepPlan.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {step.task}{" "}
                  <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {step.when}
                  </span>
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
