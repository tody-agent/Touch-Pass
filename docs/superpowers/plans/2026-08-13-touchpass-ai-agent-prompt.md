# TouchPass AI Agent 1-Prompt Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create comprehensive 1-prompt setup instructions in `docs/AI_AGENT_PROMPT.md` and `docs/AI_AGENT_PROMPT.vi.md` enabling AI agents to autonomously install TouchPass step-by-step for non-technical users.

**Architecture:** Documentation & AI Prompt Engineering.

---

### Task 1: Re-architect `docs/AI_AGENT_PROMPT.md` with Autonomous Prompt Instructions

**Files:**
- Modify: `docs/AI_AGENT_PROMPT.md`

- [ ] **Step 1: Write `docs/AI_AGENT_PROMPT.md` with detailed 4-phase execution prompt**
- [ ] **Step 2: Commit changes to git**

```bash
git add docs/AI_AGENT_PROMPT.md
git commit -m "docs: overhaul AI Agent 1-prompt setup guide for non-technical users"
```

---

### Task 2: Create Vietnamese Guide `docs/AI_AGENT_PROMPT.vi.md` and Update README

**Files:**
- Create: `docs/AI_AGENT_PROMPT.vi.md`
- Modify: `README.md`
- Modify: `README.vi.md`

- [ ] **Step 1: Write `docs/AI_AGENT_PROMPT.vi.md` in friendly Vietnamese**
- [ ] **Step 2: Update README links to reference both EN and VI AI agent prompt guides**
- [ ] **Step 3: Run documentation tests (`python -m unittest tests/test_documentation.py`)**
- [ ] **Step 4: Commit changes to git**

```bash
git add docs/AI_AGENT_PROMPT.vi.md README.md README.vi.md
git commit -m "docs: add Vietnamese AI agent prompt guide docs/AI_AGENT_PROMPT.vi.md"
```

---

### Task 3: Verification & Push to GitHub

- [ ] **Step 1: Run full documentation test gate (`python run_test_gate.py`)**
- [ ] **Step 2: Push changes to GitHub main branch**

```bash
git push origin main
```
