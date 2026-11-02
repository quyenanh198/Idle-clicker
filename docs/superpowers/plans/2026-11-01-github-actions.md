# Build and test automation

User request: use GitHub Actions to build and test the game.

- [ ] Add a static build command that checks JavaScript syntax and packages only runtime files/PNG assets into dist. Validate inputs before replacing previous output.
- [ ] Test missing-asset failure and clean runtime-only output in temporary fixtures.
- [ ] Add a preview server and Playwright mode that exercise dist on a separate local port, never an existing development server.
- [ ] Add a least-privilege GitHub Actions workflow for pushes, pull requests and manual dispatch: Node 24, npm ci, build, unit tests, Chromium dependencies/browser tests, build artifact and test reports.
- [ ] Verify locally, publish the changes, observe a successful GitHub Actions run and report its URL.
