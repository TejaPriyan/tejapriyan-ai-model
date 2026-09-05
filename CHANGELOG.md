# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Rewritten, user-focused `README.md` with a "pick how you want to use it" guide and a troubleshooting section.
- Community health files: `LICENSE` (Apache-2.0), `NOTICE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`.
- GitHub issue forms (bug report, feature request, question), issue template config, pull request template and `CODEOWNERS`.
- Continuous integration workflow (`.github/workflows/ci.yml`) that type-checks and builds every push and pull request.
- Weekly Dependabot updates for npm packages and GitHub Actions.
- `npm run typecheck` script, `.editorconfig` and `.nvmrc` for a consistent developer setup.
- `public/robots.txt` and `public/sitemap.xml` for search engines.

### Changed
- Package renamed from `react-vite-tailwind` to `tejapriyan-ai-model` and versioned `1.0.0`.
- `tsconfig.json` now includes `vite/client` types so `import.meta.env` type-checks.

### Fixed
- Removed unused icon imports in `ChatDemo.tsx` that made `tsc --noEmit` fail.

## [1.0.0] - 2025-09-05

### Added
- Interactive website for the Tejapriyan-8B model: hero, philosophy, training pipeline, benchmarks, stack table, install guide, integrations and model card.
- In-browser chatbot with built-in answering engine (math, dates, general knowledge, code and SQL) plus streaming from a local Ollama instance or a remote node URL.
- Interactive SQL sandbox running SQLite via WebAssembly with three sample datasets.
- Dark and light themes, copyable code blocks and live HTML preview.
- Cloudflare tunnel sharing scripts (`share-live-model.bat`, `share-live-model.ps1`).
- GitHub Pages deployment workflow and Vercel SPA configuration.

[Unreleased]: https://github.com/TejaPriyan/tejapriyan-ai-model/compare/main...HEAD
[1.0.0]: https://github.com/TejaPriyan/tejapriyan-ai-model/releases/tag/v1.0.0
