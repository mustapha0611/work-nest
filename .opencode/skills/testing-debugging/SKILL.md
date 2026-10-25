---
name: testing-debugging
description: Diagnose WorkNest defects systematically and add focused tests without masking root causes.
---

# Testing and Debugging Workflow

1. Reproduce the issue or state clearly what information is missing. Inspect logs, test output, and relevant code before guessing.
2. Explain the likely execution path and distinguish observed facts from hypotheses.
3. Identify the smallest test that reproduces the behavior where practical.
4. Fix the root cause rather than suppressing the symptom. Do not weaken/delete tests simply to get a green result.
5. Test success paths, error paths, boundaries, and security-sensitive behavior as appropriate.
6. Run the narrowest useful check first, then broader checks if available.
7. Report exact commands and outcomes, including skipped checks and environmental blockers.
8. Avoid destructive debugging commands or data resets without explicit approval.
9. Explain why the defect occurred and how to recognize similar issues.
10. Finish with a small understanding check when the issue teaches an important concept.
