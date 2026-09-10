# Security Policy

## Supported versions

This project is a single-page website plus published model weights. Only the
latest commit on `main` (and the site deployed from it) receives fixes.

| Version | Supported |
| --- | --- |
| `main` / latest deployment | ✅ |
| Older commits, forks and mirrors | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub:

1. Go to the [Security advisories page](https://github.com/TejaPriyan/tejapriyan-ai-model/security/advisories/new).
2. Describe the issue, the impact, and the steps to reproduce it.
3. Include the browser/OS or Ollama version if it is relevant.

You can expect an acknowledgement within **7 days** and a status update within
**30 days**. If a fix is released, you will be credited in the advisory unless
you prefer to stay anonymous.

## What is in scope

- Cross-site scripting or code injection in the website (for example through
  chat input, rendered Markdown, the code preview iframe, or the SQL sandbox)
- Leaking user input or conversation content to any third party
- Supply-chain issues in the build or deployment workflows
- Anything that lets a remote "model node" URL do more than return chat
  completions

## What is out of scope

- The behaviour, accuracy or output of the AI model itself (report those as a
  normal bug or feature request)
- Vulnerabilities in [Ollama](https://github.com/ollama/ollama), Cloudflare
  Tunnel, or the upstream Qwen3 base model — report those to their maintainers
- Issues that require running the site with `OLLAMA_ORIGINS="*"` **and**
  deliberately pasting a hostile node URL, which is documented user-controlled
  behaviour
- Missing hardening headers on third-party hosting platforms (Vercel, GitHub
  Pages) that we do not control

## A note on privacy

By design, this project never sends user input to a third-party AI API. Answers
are produced by the in-browser engine, the visitor's own local Ollama instance,
or a node URL the user explicitly configured. Any change that breaks this
guarantee is treated as a security issue.
