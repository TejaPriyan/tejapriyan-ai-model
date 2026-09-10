# Contributing to Tejapriyan AI

Thanks for taking the time to help out! This project is small and friendly — bug reports, docs fixes and typo corrections are just as welcome as code.

## Ways to contribute

- 🐛 **Report a bug** — [open a bug report](https://github.com/TejaPriyan/tejapriyan-ai-model/issues/new?template=bug_report.yml)
- 💡 **Suggest a feature** — [open a feature request](https://github.com/TejaPriyan/tejapriyan-ai-model/issues/new?template=feature_request.yml)
- ❓ **Ask a question** — [start a Q&A issue](https://github.com/TejaPriyan/tejapriyan-ai-model/issues/new?template=question.yml)
- 📝 **Improve the docs** — the README, model card text and troubleshooting notes can always be clearer
- 🔧 **Send a pull request** — see below

## Getting set up

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/<your-username>/tejapriyan-ai-model.git
cd tejapriyan-ai-model
npm install
npm run dev          # http://localhost:5173
```

Before you push:

```bash
npm run typecheck    # must pass
npm run build        # must succeed
```

Both are also run by CI on every pull request.

## Pull request checklist

1. Fork the repo and create a branch: `git checkout -b fix/short-description`.
2. Keep the change focused — one topic per PR is much easier to review.
3. Match the existing style: TypeScript, functional React components, Tailwind utility classes, `@/` import alias for anything under `src/`.
4. Run `npm run typecheck` and `npm run build` locally.
5. Describe *what* changed and *why*, and add a screenshot or GIF for anything visual.
6. Open the PR against `main` and fill in the template.

## Commit messages

Short, imperative and prefixed by area where it helps:

```
fix: keep chat scrolled to the newest message
feat(sql-lab): add a fourth sample dataset
docs: clarify the OLLAMA_ORIGINS step
```

## Code style notes

- **Components** live in `src/components`, one component per file, default-exported.
- **No new dependencies** without a good reason — the build is intentionally light and ships as a single HTML file.
- **Privacy is a hard rule.** Nothing in this project may send user input to a third-party service. Answers come from the built-in engine, the visitor's own Ollama instance, or a node URL the user explicitly configured.
- **Accessibility matters** — keep interactive elements keyboard-reachable and give icon-only buttons an `aria-label`.

## Reporting security problems

Please do **not** open a public issue for a security vulnerability. Follow [SECURITY.md](SECURITY.md) instead.

## Code of Conduct

By participating you agree to uphold the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Contributions are accepted under the [Apache License 2.0](LICENSE), the same license that covers this project.
