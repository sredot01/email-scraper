<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture

- All model calls go through Lovable AI Gateway via the AI SDK (`ai` + `@ai-sdk/openai`) on the Responses API, with helpers in server-only modules (`src/lib/ai/*.server.ts`, `src/lib/interview-prep.server.ts`) and `createServerFn` wrappers in `*.functions.ts` that dynamically import server-only code inside the handler — why: secrets and provider code must stay out of the client bundle.
