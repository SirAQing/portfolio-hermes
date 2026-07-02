# Portfolio Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the portfolio SPA by cleaning up unused files, unifying section titles, simplifying the Hero section, and fixing AI chat interactions.

**Architecture:** We are refactoring an existing React + Vite SPA. Changes include file deletion, component extraction (Shared SectionTitle), and prop/event handler updates for React components.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vite

---

### Task 1: Codebase Cleanup

**Files:**
- Modify: `.gitignore`
- Delete: `src/components/ThemeToggle.tsx`
- Delete: `src/components/SharingSection.tsx`
- Delete: `src/assets/hero.png`

**Step 1: Update .gitignore**
Modify `.gitignore` to ensure `dist/` and `__pycache__/` are ignored. Add them to the end of the file if they do not exist.

**Step 2: Delete unused files**
Remove `src/components/ThemeToggle.tsx`, `src/components/SharingSection.tsx`, and `src/assets/hero.png`.

**Step 3: Commit**
```bash
git add .gitignore
git rm src/components/ThemeToggle.tsx src/components/SharingSection.tsx src/assets/hero.png
git commit -m "chore: remove unused components and assets, update gitignore"
```

### Task 2: Extract Shared SectionTitle

**Files:**
- Create: `src/components/shared/SectionTitle.tsx`
- Modify: `src/components/ExperienceSection.tsx`
- Modify: `src/components/ProjectsSection.tsx`
- Modify: `src/components/MiscSections.tsx`

**Step 1: Create Shared Component**
Create `src/components/shared/SectionTitle.tsx` with a unified Tailwind styling that accepts `icon`, `number`, `title`, and `subtitle` props.

**Step 2: Refactor ExperienceSection**
Import and use the new `SectionTitle` in `src/components/ExperienceSection.tsx`, removing its local title implementation.

**Step 3: Refactor ProjectsSection**
Import and use `SectionTitle` in `src/components/ProjectsSection.tsx`, removing its local title implementation.

**Step 4: Refactor MiscSections**
Import and use `SectionTitle` in `src/components/MiscSections.tsx`, removing its local title implementation.

**Step 5: Verify Build**
Run: `npm run build`
Expected: Build passes without TypeScript or ESLint errors.

**Step 6: Commit**
```bash
git add src/components/shared/SectionTitle.tsx src/components/ExperienceSection.tsx src/components/ProjectsSection.tsx src/components/MiscSections.tsx
git commit -m "refactor: extract and use shared SectionTitle component"
```

### Task 3: Hero Section & Interaction Fixes

**Files:**
- Modify: `src/components/HeroSection.tsx`
- Modify: `src/components/FloatingAssistant.tsx`

**Step 1: Update FloatingAssistant to listen for external open event**
Add a `useEffect` hook in `FloatingAssistant.tsx` to listen for a custom `open-chat` event on the `window` object and call `setIsOpen(true)`.

**Step 2: Update FloatingAssistant Quick Actions**
Modify `FloatingAssistant.tsx` so clicking a quick action button directly triggers the `handleSend` function instead of just setting the input value.

**Step 3: Refactor HeroSection Bio & CTA**
Update `src/components/HeroSection.tsx`:
1. Replace the multiple bio paragraphs with a single highlight line.
2. Update the "Ask Me" CTA button to dispatch the `open-chat` custom event instead of using `href="#chat"`.
3. Reduce the total number of CTA buttons if necessary to simplify the UI.

**Step 4: Verify Build**
Run: `npm run build`
Expected: Build passes without errors.

**Step 5: Commit**
```bash
git add src/components/HeroSection.tsx src/components/FloatingAssistant.tsx
git commit -m "feat: simplify hero section and improve chat interactions"
```
