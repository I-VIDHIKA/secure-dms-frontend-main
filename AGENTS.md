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

- Keep all backend access in `src/api/*.ts`; authenticated requests run in client-side React Query hooks or event handlers so browser tokens never enter SSR.
- Protected pages stay under the client-only `_app` layout, with `requireAuth()` checks and the browser-held session needed for route access.
