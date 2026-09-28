---
name: update-dependencies
description: Controlled dependency updates for ROX projects (npm and Composer) under the Secure Development Lifecycle. Use whenever the user asks to update dependencies, bump packages, run npm/composer outdated or npm/composer audit, apply CVE or advisory fixes, patch a vulnerable transitive dependency, pin unfixed versions to fixed/exact versions, do monthly/quarterly dependency maintenance, or refresh package.json / composer.json / lockfiles. Prefer this over blind npm update, composer update or npm audit fix.
---

# Update Dependencies

Run dependency updates in a controlled, reproducible way. This skill encodes ROX SDLC practice for Dependencies, Dependency Management, Supply Chain Security, and Maintenance & Vulnerabilities (ISO 27001: 8.8 and 8.32; OWASP A06 Vulnerable Components, A08 Integrity Failures).

## Goals

- Update only with intent and a reviewable change
- Keep security risk low
- Keep breaking changes manageable
- Prefer fixed (exact) versions over unfixed ranges in application manifests

## When to update

Update dependencies only when one of these applies:

- Periodic maintenance (monthly / quarterly)
- Critical or High CVE
- Functionally necessary for the work at hand

Never run unselected bulk upgrades:

```bash
# Do not use these as the update path
npm update
composer update
npm audit fix
npm audit fix --force
```

Those commands refresh many packages without per-package analysis. `npm audit fix` is the same unselected bulk bump wearing a security label, and `--force` will happily install majors and downgrade you into a different set of problems. Use targeted installs/updates below instead.

## Workflow

### 1. Inventory

Detect which ecosystems the repo uses (`package.json`, `composer.json`), list outdated packages, **and check for known advisories**. Outdated tells you what moved; audit tells you what matters.

**Composer:**

```bash
composer outdated
composer audit          # Composer 2.4+
```

On machines with Laravel Valet, prefer `valet php $(which composer) outdated` (or the project's documented Composer entrypoint) so PHP matches the linked site.

**npm:**

```bash
npm outdated
npm audit --omit=dev    # add a plain `npm audit` pass if dev tooling ships to users
```

Optional overview:

```bash
npx npm-check-updates
```

`npm outdated` and `npm audit` exit non-zero when they find something. That is their normal reporting behaviour, not a failed command — read the output and continue.

Summarize candidates before changing anything. Prefer a short table: package, current, wanted/latest, type (patch / minor / major), advisory (if any).

### 2. Analyse each candidate

For every package you propose to touch, determine:

| Factor | What to check |
|--------|----------------|
| Update type | patch / minor / major |
| Changelog | release notes for the versions being crossed |
| Breaking changes | majors, and minors that document breaks |
| Security impact | CVE / advisory severity and whether this update remediates it |
| Release age | how long the target version has been published (see cooldown) |
| Package health | maintainer change, deprecation notice, sudden ownership transfer |

When unsure, **do not update** without asking the user. Skip speculative majors during routine maintenance unless a CVE or functional need requires them.

Batch only packages that are clearly related and low-risk (for example several patch bumps). Keep majors and high-risk packages in their own change when practical.

#### Cooldown on fresh releases

Do not install a version published within roughly the **last 7 days** unless that version *is* the remediation you need. Compromised-release incidents (ua-parser-js, chalk/debug, and friends) are caught and yanked inside that window; waiting it out costs nothing during routine maintenance.

```bash
npm view package-name time --json      # publish timestamps per version
composer show vendor/package --all     # released/versions info
```

Supporting integrity checks, cheap to run:

```bash
npm audit signatures                   # registry signatures / provenance
```

Treat a deprecation warning or a recent maintainer handover as a reason to raise it with the user, not to proceed quietly.

#### Majors

One major at a time — never cross two major versions of the same package in a single step. Read the vendor's upgrade guide and run their codemod if they ship one. A major belongs in its own commit, and usually its own PR.

### 3. Apply updates (targeted)

Always pin the intended version in the manifest / via a targeted command. Follow the project's change process: branch → change → validate → pull request.

Commit one package (or one clearly related batch) at a time. A dependency PR that bisects is worth far more than one that is tidy.

#### Set unfixed versions to fixed versions

While updating (and when inventory shows loose pins), convert unfixed constraints to **exact** versions. Do not leave or introduce floating ranges.

| Ecosystem | Unfixed (avoid / fix) | Fixed (prefer) |
|-----------|------------------------|----------------|
| npm | `^1.2.3`, `~1.2.3`, `*`, `>=1.2.3`, `1.x` | `1.2.4` |
| Composer | `^1.2`, `~1.2.3`, `*`, `>=1.2`, `1.*` | `1.2.4` |

- **npm:** write exact versions into `package.json` (no caret/tilde). Prefer `npm install --save-exact package-name@1.2.4` (or `--save --save-exact`).
- **Composer:** set the require constraint to the exact version you install (e.g. `"vendor/package": "1.2.4"`), not a caret/tilde range — then refresh the lockfile for that package.
- Touching a package for any reason is a chance to tighten its pin; optionally tighten other clearly unfixed direct deps in the same PR when the user wants a pinning pass.
- Never rewrite ranges to `*` or otherwise loosen pinning as part of an update.

**Applications only.** In a **published library**, exact pins in `package.json` / `composer.json` force duplicate or conflicting versions onto every consumer. Libraries keep compatible ranges (`^1.2.3`) and rely on the lockfile only for their own CI. Check whether the package is published before pinning: `"private": true` (npm) or no distribution target means application, pin freely.

The tradeoff to state if a developer pushes back: exact pins mean you stop receiving transitive patch fixes for free, so pinning raises the maintenance cadence. The **lockfile** is what guarantees a reproducible install; the **pin** is what guarantees the version was a decision. Both, not either.

Make exact-by-default durable for npm so the next casual `npm install` does not reintroduce carets. First check whether the global npmrc already covers it — pipe through `grep` rather than viewing the file directly, since it may hold auth tokens:

```bash
cat ~/.npmrc | grep 'save-exact'
```

If `save-exact` is not set there, ask the user whether to add `save-exact=true` to the global `~/.npmrc` before falling back to a project-level setting:

```bash
npm config set save-exact true --location project   # writes .npmrc
```

**Composer** — update specific packages and bump to a fixed version in `composer.json`:

```bash
composer update vendor/package --bump-after-update
```

`--bump-after-update` (and `composer bump`) require Composer 2.4+. After it runs, if `composer.json` still has `^` / `~`, replace with the exact resolved version.

When the update is refused because the package's own dependencies must move too, add `-W` rather than reaching for a bare `composer update`:

```bash
composer update vendor/package -W --bump-after-update   # --with-all-dependencies
composer why-not vendor/package 1.2.4                   # what is blocking the version
```

Small related batch:

```bash
composer update vendor/package another/package --bump-after-update
```

**npm** — install an exact version and write it to `package.json`:

```bash
npm install --save-exact package-name@1.2.4
```

Use `--save-dev --save-exact` when the package is a devDependency, and `-w <workspace>` in a monorepo. Match existing save conventions in the repo (`package-lock.json` vs other lockfiles).

#### Transitive dependencies

Most advisories land in a package you do not require directly, where pinning your direct deps changes nothing. Fix it at the root manifest and record why.

**npm** — force the fixed version through `overrides` in `package.json`:

```jsonc
{
  "overrides": {
    "vulnerable-package": "1.2.4"
  }
}
```

**Composer** — either require the transitive directly at the fixed version, or forbid the vulnerable range so the resolver cannot pick it:

```jsonc
{
  "conflict": {
    "vendor/vulnerable": "<1.2.4"
  }
}
```

Rules for both: pin the narrowest thing that fixes it, comment the advisory ID next to the entry, and **remove the override once the parent package ships a release that pulls the fixed version itself**. An override left behind becomes a silent pin nobody remembers, which is the failure mode this section exists to avoid. Prefer updating the parent package when a fixed parent already exists.

### 4. Validate

After each meaningful update batch (and before opening / updating the PR):

**Required**

- Install from the lockfile, clean — this is what CI and production will do:
  ```bash
  npm ci
  composer validate --strict && composer install
  ```
  `npm ci` fails when `package.json` and the lockfile disagree; `npm install` quietly repairs it and hides the problem until CI. Use `ci`.
- Build / typecheck / compile using the project's usual commands
- Run the project's test suite
- Smoke-check the app locally when the stack supports it
- Sanity-check the lockfile diff:
  ```bash
  git diff --stat package-lock.json composer.lock
  ```
  Hundreds of changed lines after one targeted bump means a bulk update slipped in. Investigate before committing.

**Extra attention**

- Authentication flows
- API integrations
- Forms and validation
- Admin surfaces (Statamic, Laravel Nova, and similar)

If validation fails, fix or revert the offending package before continuing. Prefer reverting a bad bump over stacking more updates on a broken tree.

#### Rollback

```bash
# npm — discard the bump and restore the previous tree
git checkout -- package.json package-lock.json && npm ci

# Composer — go back to the known-good version explicitly
git checkout -- composer.json composer.lock && composer install
composer require vendor/package:1.2.3 -W      # when pinning back deliberately
```

Then re-run validation to confirm the tree is green again before moving on.

### 5. Pull request

Open a PR that follows the standard ROX SDLC pull-request procedure (peer review and security checks). Keep the PR focused on dependency changes; avoid mixing feature work.

If the `make-pr-easy-to-review` skill is available, use it before opening (or when updating) the PR to clean up commit noise and tighten the description — a dependency PR is exactly the kind reviewers need to bisect and trust quickly.

PR body should include:

- Why now (maintenance window, CVE, functional need)
- Packages updated, with from → to versions
- Update types (patch / minor / major)
- Security notes (CVE / advisory IDs when relevant)
- Any `overrides` / `conflict` entries added, and the condition for removing them
- Validation performed (commands + smoke checks)

## Agent behaviour

1. Inventory first; do not bump packages before showing the candidate list when the user has not already named packages/versions.
2. Run `npm audit` / `composer audit` alongside `outdated` — outdated alone cannot tell you what is urgent.
3. Prefer the smallest sufficient set of updates.
4. Never suggest or run blanket `npm update` / `composer update` / `npm audit fix` as the solution.
5. For Critical/High CVEs, prioritize the remediating package(s) over opportunistic upgrades.
6. Set unfixed versions to fixed versions in applications: no `^` / `~` / `*` / open ranges on packages you touch. Leave ranges alone in published libraries.
   - Before setting `save-exact` at project level, check `~/.npmrc` for it; if missing globally, ask the user whether to add it there instead.
7. Fix vulnerable transitives at the root manifest (`overrides` / `conflict`), not by pinning unrelated direct deps.
8. Honour the cooldown: a version published days ago is not a safe default.
9. Non-zero exit from `npm outdated` / `npm audit` is a finding, not a tool failure — keep going.
10. Respect Valet / project PHP tooling for Composer commands when that is the local convention.
11. Leave lockfiles consistent with the tooling you used (`composer.lock`, `package-lock.json`, etc.), and verify with a clean `npm ci` / `composer install`.

## Output shape

When reporting progress or finishing, use a compact summary:

```markdown
## Dependency update summary
- **Reason:** [maintenance | CVE | functional need | pin unfixed → fixed]
- **Updated:**
  - `pkg` `^1.2.3` → `1.2.4` (patch + fixed pin)
- **Transitive pins:**
  - `overrides.vulnerable-pkg` → `1.2.4` (GHSA-xxxx; drop when `parent-pkg` ≥ 3.1.0)
- **Skipped / deferred:**
  - `other` (major; needs review)
  - `fresh-pkg` (published 2 days ago; cooldown)
- **Validation:**
  - [commands run and result]
- **PR:** [link or next step]
```
