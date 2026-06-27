# Contributing to Dealio Desktop

First off, thanks for taking the time to contribute! 🎉

We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Code of Conduct

All contributors are expected to adhere to our Code of Conduct (Contributor Covenant). Please be respectful and professional in all interactions.

## How to Contribute

### Reporting Bugs

1.  **Search existing issues**: potential duplicates.
2.  **Create an issue**: Use the bug report template if available. Include:
    - Clear title and description
    - Steps to reproduce
    - Environment details (OS, Version, etc.)
    - Screenshots or logs if applicable

### Requesting Features

Feature requests are welcome! Open an issue and select "Feature Request". Please describe the problem you're trying to solve and your suggested solution.

### Development Workflow

1.  **Fork the repo** and clone it locally.
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Create a branch** for your edits:
    ```bash
    git checkout -b feature/name-of-your-feature
    # or
    git checkout -b fix/name-of-your-bugfix
    ```
4.  **Make your changes**.
5.  **Test your changes**:

    ```bash
    # Run all tests (Frontend, Backend, E2E)
    pnpm run test:all

    # Or run specific tests
    pnpm test:frontend
    pnpm test:backend
    pnpm test:e2e

    # Verify the app runs
    pnpm tauri dev
    ```

### Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the `README.md` with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  Increase the version numbers in any examples files and the `README.md` to the new version that this Pull Request would represent.
4.  You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

### Coding Style

- We use **Prettier** for code formatting. Please run `pnpm format` before committing.
- We use **Oxlint** and **Clippy** for linting. Run `pnpm run lint:all` to check for errors.
- Follow **Conventional Commits** for commit messages. We use **Commitizen** to make this easy:
  - Run `pnpm cz` (or `npx cz`) instead of `git commit` to use the interactive commit wizard.
  - Standard prefixes include `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.

## License

By contributing, you agree that your contributions will be licensed under its [PolyForm Noncommercial License 1.0.0](LICENSE).
