# Pyra Branch Protection & Security Policy

This document details the branch protection configuration required on the `main` branch to enforce code quality, security checks, and audit compliance before any code reaches production.

---

## 1. Branch Protection Rules for `main`

Configure these rules in **GitHub Repository Settings → Branches → Branch protection rules → Add rule**:

### Branch name pattern
`main`

### Protection Settings
1. **Require a pull request before merging**
   - Require approvals: `1`
   - Dismiss stale pull request approvals when new commits are pushed: **Enabled**
   - Require review from Code Owners: **Enabled**

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: **Enabled**
   - **Required Status Checks:**
     - `Lint & Typecheck`
     - `Unit & Integration Tests`
     - `CodeQL SAST`
     - `Dependency Audit (Production)`
     - `Worker Build`
     - `Web Build`
     - `Playwright E2E Suite`
     - `CI Required Checks Gate`

3. **Require signed commits**
   - Enabled (enforces cryptographic verification of committer identity).

4. **Require conversation resolution before merging**
   - Enabled (all PR review comments must be explicitly resolved).

5. **Do not allow bypassing the above settings**
   - Enabled (rules apply to administrators).

---

## 2. GitHub CLI Configuration Command

If configuring via `gh` CLI:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/:owner/:repo/branches/main/protection \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint & Typecheck",
      "Unit & Integration Tests",
      "CodeQL SAST",
      "Dependency Audit (Production)",
      "Worker Build",
      "Web Build",
      "Playwright E2E Suite",
      "CI Required Checks Gate"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```
