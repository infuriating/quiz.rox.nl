---
paths:
  - '.github/workflows/**'
---

# GitHub Actions — pin the latest secure release SHA

When editing `.github/workflows/*.yml`, pin every third-party `uses:` to the **full 40-character commit SHA** of that action's **latest secure release**. Put the release tag in a trailing comment so humans and Dependabot can read it.

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

Do not copy stale `@v3`/`@v4`/`@v5` tags or old SHAs from examples, skill docs, or other repos.

## ISO/IEC 27001:2022

This is ROX SDLC practice for CI supply-chain integrity. It implements (does not certify) these Annex A controls:

| Control                | Why this pin                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **5.19 / 5.21 / 5.23** | Supplier relationships, ICT supply chain, cloud services — Actions are third-party code executed in CI with repo tokens |
| **8.8**                | Technical vulnerabilities — run the latest _secure_ release, not a rewritten or abandoned tag                           |
| **8.9**                | Configuration management — the SHA is immutable and reviewable in git                                                   |
| **8.25 / 8.28 / 8.30** | Secure SDLC, secure coding, outsourced development — third-party Actions are outsourced build code                      |
| **8.32**               | Change management — a moved tag is a silent change; a SHA bump is a reviewable diff                                     |

GitHub's secure-use guidance: a full-length commit SHA is currently the only immutable action pin. Tags (`@v7`, `@v7.0.1`) and branches can be force-pushed. See https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions

This rule is **not** an ISO 27001 certificate, Statement of Applicability, or audit opinion. Map it in the SoA if the ISMS owner treats CI Actions as a supplier.

## How to pin

1. Open `https://github.com/<owner>/<name>/releases/latest` (or `gh api repos/<owner>/<name>/releases/latest --jq .tag_name`).
2. Resolve that **release tag** to a commit SHA (not a shortened SHA, not a tag-object SHA):

   ```bash
   gh api repos/<owner>/<name>/commits/<tag> --jq .sha
   ```

3. Write `uses: <owner>/<name>@<40-char-sha> # <tag>`.
4. Confirm the SHA belongs to that action's repository, not a fork.
5. Skim that release's notes for renamed/removed inputs.

**Fallback** (SHA lookup unavailable, e.g. offline): pin the **latest secure exact version tag** (`@v7.0.1`), never a floating major (`@v7`) and never `@latest`. Exact tags are still mutable — replace with the SHA before merge. "Secure" means the newest release that includes known hardening (see checkout below) and has no unpatched GHSA you are relying on.

A pin nobody bumps fails **8.8**. When you touch a workflow, re-resolve every Action in that file against `/releases/latest`. Prefer Dependabot `package-ecosystem: github-actions` so SHA + comment update together.

## Common official actions (floor, 2026-08-24)

Re-resolve these when you touch a workflow. They are a floor, not gospel.

| Action                      | SHA                                        | Release |
| --------------------------- | ------------------------------------------ | ------- |
| `actions/checkout`          | `3d3c42e5aac5ba805825da76410c181273ba90b1` | v7.0.1  |
| `actions/setup-node`        | `820762786026740c76f36085b0efc47a31fe5020` | v7.0.0  |
| `actions/setup-python`      | `5fda3b95a4ea91299a34e894583c3862153e4b97` | v7.0.0  |
| `actions/cache`             | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` | v6.1.0  |
| `actions/upload-artifact`   | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | v7.0.1  |
| `actions/download-artifact` | `3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` | v8.0.1  |

This repo's workflows pin checkout / setup-node / setup-python to the SHAs above.

## Do not

- Assume the version in one workflow file is current; grep all of `.github/workflows/` and align them.
- Use `@latest`, `@main`/`@master`, a floating major (`@v7`), or a short SHA.
- Omit the `# vX.Y.Z` comment — Dependabot will not bump a bare SHA cleanly.
- Confuse GitHub Action versions with npm/pip pins; they are unrelated supply chains.

## Third-party actions

For `uses: org/action@…` where `org !== actions`, same rule: latest **secure** release SHA + version comment. Check that repo's releases and advisories separately. A Marketplace "verified creator" badge is not a substitute for an immutable pin.

## checkout specifically

`actions/checkout@v7` (v7.0.0+, including the SHA above) refuses unsafe fork-PR checkout in `pull_request_target` and some `workflow_run` flows by default. Do not set `allow-unsafe-pr-checkout: true` unless the workflow has been reviewed for pwn-request risk.

Do not pin checkout to a pre-hardening SHA (anything before v7.0.0 that missed the 2026-07-20 backport). v1 never received that guard.
