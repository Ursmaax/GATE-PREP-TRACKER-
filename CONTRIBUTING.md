# Contributing to G4Gate

Thanks for helping make GATE & DSA prep easier for aspirants! 🚀

## How to contribute

1. **Fork** the repository.
2. Create a branch: `git checkout -b feature/your-idea`.
3. Make your changes and test them locally (`npm start`).
4. Commit with a clear message: `git commit -m "feat: describe the change"`.
5. Push: `git push origin feature/your-idea`.
6. Open a **Pull Request**.

## Guidelines

- Keep the front-end **dependency-free** (vanilla HTML/CSS/JS) unless there's a
  strong reason otherwise.
- Follow the existing dark emerald/cyan design system in
  [`public/assets/style.css`](./public/assets/style.css).
- New app data (subjects, questions, leaders, etc.) belongs in
  [`public/assets/data.js`](./public/assets/data.js).
- Practice questions should be **original, PYQ-style items** — do not reproduce
  copyrighted exam papers.

## Code style

- 2-space indentation, double quotes in JS strings.
- Escape user content with the built-in `esc()` helper before injecting HTML.

Thank you for contributing! 💚
