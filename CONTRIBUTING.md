# Contributing to KAIZEN

First off, thank you for considering contributing to KAIZEN! It's people like you that make open source such a great community to learn, inspire, and create.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if it has already been reported. When you are creating a bug report, please include as many details as possible:
* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.
* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Explain why this enhancement would be useful to most users

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`npm test` / `python -m pytest`).
5. Make sure your code lints (`npm run lint`).
6. Issue that pull request!

## Project Architecture

* **Frontend**: Next.js App Router (`/app`), React Components (`/components`), UI styling via Tailwind CSS.
* **Backend ML**: Python scripts and models are located in `/llm_backend`. Please ensure `venv` isolation when modifying scripts.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
