# Technical Documentation Writing

::: tip Preface
**Does anyone actually read the docs you write?** Many developers think "as long as the code runs, docs can wait." The result? New team members can't understand the project, API integration relies entirely on verbal communication, and even you forget why you made certain design decisions six months later.

This chapter will teach you the core methods of technical documentation writing, so your docs actually get read, understood, and put to use.
:::

**What will you learn from this article?**

| Chapter | Content | Key Concepts |
|---------|---------|--------------|
| **Chapter 1** | Document Types and Structure | How to write different types of docs |
| **Chapter 2** | Writing Principles | Clarity, accuracy, conciseness |
| **Chapter 3** | Practical Comparisons | Good docs vs. bad docs |
| **Chapter 4** | Documentation Maintenance | Keeping docs up to date |

By the end of this chapter, you'll be able to write technical documentation that is well-structured, accurate, and easy to maintain.

---

## 0. The Big Picture: Why Does Technical Documentation Matter?

Code tells the computer *what to do*; documentation tells humans *why it's done that way*. A project without documentation is like an appliance without a manual — it works, but you're left guessing how to use it.

::: tip The Value of Good Documentation
- **Reduces communication overhead**: New team members can get up to speed on their own, reducing repetitive explanations
- **Preserves decision context**: Records the "why," not just the "what"
- **Boosts project credibility**: Good docs are the front door of an open-source project
- **Accelerates collaboration**: API docs let front-end and back-end teams work in parallel
:::

---

## 1. Document Types and Structure

Explore the standard structures for different document types through the interactive component below:

<DocStructureDemo />

### 1.1 Common Document Types

| Document Type | Target Audience | Core Content |
|--------------|-----------------|--------------|
| **README** | Everyone | What the project is, how to use it, how to contribute |
| **API Documentation** | API consumers | Endpoints, parameters, responses, error codes |
| **Architecture Documentation** | Development team | System design, tech stack choices, data flow |
| **Changelog** | Users / Developers | Version changes, additions, fixes, breaking changes |
| **Contributing Guide** | Contributors | Dev environment setup, code standards, PR workflow |

### 1.2 The Golden Structure of a README

A good README should include:

1. **Project name + one-line description**: Let people know what this is within 3 seconds
2. **Quick start**: Get it running in the fewest steps possible
3. **Features**: Core selling points
4. **Installation**: Detailed environment requirements and setup steps
5. **Usage examples**: Copy-paste-ready code
6. **Contributing guide**: How to get involved
7. **License**: Legal information

---

## 2. Writing Principles

### 2.1 Clarity First

```markdown
<!-- Bad: Vague and unclear -->
This function processes data.

<!-- Good: Specific and explicit -->
Converts raw order data into invoice format, including tax calculation and currency conversion.
```

### 2.2 Know Your Audience

Before writing, ask yourself: **Who will read this? What information do they need?**

- Writing for beginners: Explain terminology, provide complete examples
- Writing for experienced developers: Get straight to the point, provide API references
- Writing for non-technical audiences: Use analogies, avoid jargon

### 2.3 Code Examples Are the Best Documentation

```markdown
<!-- Bad: Text description only -->
Call the createUser function with username and email parameters.

<!-- Good: Provide a runnable example -->
const user = await createUser({
  name: 'John Doe',
  email: 'john@example.com'
})
// Returns: { id: 'u_123', name: 'John Doe', createdAt: '2025-01-15' }
```

---

## 3. Practical Comparisons

Compare good and bad technical writing through the interactive component below:

<TechWritingPracticeDemo />

### 3.1 Commit Message Standards

```
# Bad
fix bug
update code

# Good (Conventional Commits)
fix: resolve white screen issue on login page in Safari
feat: add support for batch PDF report export
docs: update example code in the API authentication section
```

### 3.2 The Art of Commenting

```javascript
// Bad: Describing "what" (the code already says that)
// Loop through the array
for (const item of items) { ... }

// Good: Explaining "why"
// Iterate in reverse order, because forward iteration skips the next element when deleting
for (let i = items.length - 1; i >= 0; i--) { ... }
```

---

## 4. Documentation Maintenance

### 4.1 Docs as Code

Keep documentation in the same repository as your code, managed with the same workflow:

- Documentation changes are submitted alongside code in the same PR
- CI checks documentation formatting and link validity
- Documentation is updated in sync with each release

### 4.2 Preventing Documentation Rot

| Problem | Solution |
|---------|----------|
| Outdated docs | Enforce doc updates when code changes (PR checks) |
| No ownership | Assign documentation owners |
| Duplicated content | Single source of truth, with links from other locations |

---

## 5. AI-Powered: Using LLMs to Improve Documentation Quality

LLMs are naturally gifted at technical writing — generating docs, polishing prose, and translating content are all among their strengths.

### 5.1 Generating API Documentation

> **Prompt**:
> ```
> Based on the following Express route code, generate complete API documentation including:
> - Endpoint paths and HTTP methods
> - Request parameters (path params, query params, request body) with types
> - Success and error response examples
> - Usage examples with curl
>
> [Paste your route code here]
> ```

### 5.2 Improving Technical Writing

> **Prompt**:
> ```
> Please improve the following technical documentation, with these requirements:
> 1. Keep the language concise and clear, removing unnecessary verbosity
> 2. Use active voice instead of passive voice
> 3. Keep technical terminology accurate
> 4. Add code examples where necessary
> Preserve the original meaning — only improve the quality of expression.
>
> [Paste your documentation content here]
> ```

### 5.3 Generating a README

> **Prompt**:
> ```
> Based on the following project information, generate a high-quality README.md:
> - Project name: [name]
> - One-line description: [description]
> - Tech stack: [list]
> - Core features: [list]
>
> Include: project introduction, quick start, features,
> installation steps (with code), usage examples, contributing guide, and license.
> ```

::: tip AI Usage Advice
Always verify the technical accuracy of AI-generated documentation — it may fabricate non-existent API parameters or incorrect return values. Always cross-check against the actual code.
:::

---

## 6. Summary

1. **Match the type**: Different documents have different structures and writing conventions
2. **Clarity first**: Be specific, accurate, and audience-aware
3. **Example-driven**: Good code examples are worth a thousand words
4. **Continuous maintenance**: Treat docs as code — evolve them alongside your project

::: tip Final Thought
Writing documentation isn't a waste of time — it's an **investment in saving future time**. The 30 minutes you spend writing docs today could save 10 people an hour each. Good documentation is the best investment a team can make.
:::

---

## Further Reading

- **Writing guides**: Google's Technical Writing course is free and practical.
- **Documentation tools**: VitePress, Docusaurus, GitBook, and other modern documentation frameworks.
- **API documentation**: The OpenAPI/Swagger specification is the industry standard for API docs.
- **Practical advice**: Start by writing a great README for one of your own projects.
