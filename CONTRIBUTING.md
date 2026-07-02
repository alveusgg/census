# Contributing to Alveus Census

Thanks for your interest in contributing. This is an open community project and we welcome help from anyone who wants to get involved.

## Before You Start

For small fixes (typos, obvious bugs, minor improvements) just open a PR directly. For larger changes -- new features, architectural shifts, or anything that touches the data model -- open an issue first so we can talk through the approach before you invest a lot of time.

## Getting the Project Running

Follow the setup steps in [README.md](README.md). The short version:

```bash
pnpm install
pnpm run deps:up
cp census/api/.env.example census/api/.env
# Fill in census/api/.env, then:
pnpm --filter=@alveusgg/census-api setup:api
```

Then in two terminals:

```bash
pnpm --filter=@alveusgg/census-api dev
pnpm --filter=@alveusgg/census-website start
```

## Making Changes

- **Branch off `main`** and keep your branch focused on one thing.
- **Run the formatter** before pushing: `pnpm fmt` (or `pnpm fmt:check` to see what needs fixing).
- **Database migrations** -- if you change the schema, generate a migration with `pnpm --filter=@alveusgg/census-api db:generate` and include it in your PR.
- **Keep PRs small.** One logical change per PR makes review faster and easier to revert if needed.

## Opening a Pull Request

- Write a clear title and a short description of what you changed and why.
- If your PR closes an issue, link it in the description (`Closes #123`).
- Be responsive to review feedback -- we try to review promptly and expect the same in return.

## Code Style

The project uses [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) for formatting. Run `pnpm fmt` and you're good. Beyond formatting, just try to match the style of the surrounding code.

## Reporting Bugs

Open a GitHub issue. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment info (Node version, OS, browser if relevant)

## Security Issues

Please do not report security vulnerabilities in public issues. See [SECURITY.md](SECURITY.md) for how to report them privately.

## Questions

If you're unsure about something, open an issue and ask. There are no dumb questions.
