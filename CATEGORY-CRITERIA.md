# Category Criteria — public content classification

Shared taxonomy for **both** public surfaces:

- **docs.sajivfrancis.com** — reference docs (already organized into these sections)
- **sajivfrancis.com** — writing / blog (today uses freeform `tags`; this adds a controlled `category`)

The point: as the docs and the writing grow, a reader (and the chat RAG) can see
*one* consistent classification across both sites. Tags stay freeform for
sub-topics; **category** is the single controlled axis.

## Rule of one

Every doc/post has **exactly one primary `category`** from the seven below —
chosen by answering *"what is this piece fundamentally about?"*, not *"what does it
touch?"*. Everything else it touches goes in `tags`. If two categories feel equal,
use the **Boundary decisions** table at the bottom — it is deterministic.

The seven categories (label = docs landing-page label):

| # | `category` value | Label | One-line scope |
|---|---|---|---|
| 1 | `architecture` | Architecture | Enterprise, cloud, and solution architecture; ADRs. |
| 2 | `ai` | AI | LLMs, RAG, document intelligence, agents, prompt engineering. |
| 3 | `software-engineering` | Software Engineering | DevOps, testing, and engineering practice. |
| 4 | `sap` | SAP & Enterprise Systems | S/4HANA solution architecture: asset accounting, Central Finance, PaPM. |
| 5 | `finance` | Finance | Grounded financial assessments and financial-systems methodology. Not investment advice. |
| 6 | `strategy` | Strategy | Management-research–grounded synthesis across EA, finance transformation, AI/GenAI adoption, corporate strategy. |
| 7 | `reference` | Reference | Earlier SAP work; kept for completeness. |

---

## 1. Architecture — `architecture`
**Belongs here if** the piece is fundamentally about *how a system or enterprise is
structured*: enterprise architecture (TOGAF, ArchiMate), cloud architecture, solution
architecture, integration patterns, or an architecture decision (ADR).
**Does NOT belong if** the structure is *specifically an SAP system* (→ SAP), or the
piece is about *building/operating* the software rather than its shape (→ Software
Engineering), or it's a *business* case for an approach rather than the design (→ Strategy).
**Examples:** "Hybrid RAG: cloud vs on-prem architecture"; a reference-architecture
diagram; an ADR for an eventing layer.

## 2. AI — `ai`
**Belongs here if** the subject is *the AI/ML technique or system itself* — LLMs,
RAG, embeddings, document intelligence, agents, prompt engineering, evals.
**Does NOT belong if** the piece is about the *economic/organizational impact or
adoption* of AI rather than the technology (→ Strategy).
**Examples:** "Document AI retrospective"; "Building a personal RAG"; a prompt-engineering
write-up. *(Litmus: if you removed the policy/market framing, is there still a
technical AI subject? Yes → AI.)*

## 3. Software Engineering — `software-engineering`
**Belongs here if** the subject is *the practice of building and running software* —
DevOps, CI/CD, testing, observability, code quality, tooling.
**Does NOT belong if** it's the *system's architecture* (→ Architecture) or an *AI
technique* that happens to be coded (→ AI).
**Examples:** a testing-strategy post; a CI/CD pipeline guide.

## 4. SAP & Enterprise Systems — `sap`
**Belongs here if** the piece is about *SAP/S4HANA or enterprise-system
implementation* — solution architecture, configuration, cutover, modules (FI-AA,
Central Finance, PaPM, Material Ledger, Product Costing).
**Does NOT belong if** it's the *accounting standard* the SAP module implements
(→ Finance) or *vendor-neutral* enterprise architecture (→ Architecture).
**Examples:** "Material Ledger cutover"; "Central Finance architecture".

## 5. Finance — `finance`
**Belongs here if** the subject is *financial methodology, standards, or grounded
financial assessment* — US GAAP vs IFRS, financial-statement analysis, financial-systems
methodology. Always "not investment advice".
**Does NOT belong if** it's how an *SAP module* implements the standard (→ SAP), or a
*strategic* read on markets/economics (→ Strategy).
**Examples:** "Inventory — ASC 330 vs IAS 2"; a grounded company assessment writeup.

## 6. Strategy — `strategy`
**Belongs here if** the piece is a *synthesis / point of view* grounded in management
research, about *adoption, transformation, economics, leadership, or corporate
strategy* — including the business/economic/organizational dimension of AI, EA, or
finance transformation. This is **synthesis, not the primary technical source**.
**Does NOT belong if** the subject is the underlying *technique/system itself*
(→ AI / Architecture / SAP / Finance).
**Examples:** "The AI Economic Trap"; "AI-driven leadership"; "When NOT to build a RAG".

## 7. Reference — `reference`
**Belongs here if** it's *earlier SAP/technical reference material kept for
completeness* — table dumps, command lists, installation notes, ported legacy work.
Low editorial value; high lookup value.
**Does NOT belong if** it's new editorial writing or a current solution write-up.
**Examples:** the `reference/**` SAP table/transaction references.

---

## Boundary decisions (deterministic tie-breakers)

| If it's about… | …and also touches… | Primary category | Why |
|---|---|---|---|
| The economics / adoption / policy of AI | AI tech | **Strategy** | POV/synthesis, not the technique |
| An AI technique (RAG, agents, doc-AI) | its business impact | **AI** | the system itself is the subject |
| An SAP module | the accounting standard it implements | **SAP** | implementation is the subject |
| An accounting standard | the SAP module that implements it | **Finance** | the standard is the subject |
| Vendor-neutral system design | a specific SAP system | **Architecture** | design generalizes beyond SAP |
| Building/operating software | the system's shape | **Software Engineering** | practice, not architecture |
| Old ported SAP lookup material | a current topic | **Reference** | legacy/lookup intent |

**Default when still tied:** pick the category whose *landing page* a reader would
most expect to find this under.

---

## Personal-site mapping (current posts)

Today's blog uses freeform `tags` only. Proposed `category` for existing editorial posts:

| Post | category | Note |
|---|---|---|
| The AI Economic Trap | `strategy` | economics/policy POV, not AI tech |
| AI-driven leadership | `strategy` | leadership synthesis |
| Document AI retrospective | `ai` | document-intelligence technique |
| ai-ai-ai | `ai` or `strategy` | classify by whether it's technique vs commentary |
| Legacy `project-*` portfolio posts | `reference` *(or keep `legacy: true` only)* | predate the taxonomy; low editorial value |

**Legacy handling:** ported portfolio/project posts (`legacy: true`) can either be
categorized `reference` or simply excluded from category navigation via the existing
`legacy` flag — recommend the latter so category pages show only current writing.

---

## Implementation (proposed, not yet done)

1. **Schema** — add to the blog collection: `category: z.enum([...the 7 values]).optional()`
   (optional during backfill; required for new non-legacy posts).
2. **Backfill** — set `category` on the ~current editorial posts per the table above.
3. **Surface it** — category badge on each post + post-list; `/category/<slug>` filter
   pages mirroring the docs sections, so the classification is visible and browsable.
4. **Docs parity** — the docs site already *is* organized by these seven; no change
   needed there beyond keeping the labels/criteria in sync with this file.

This file is the single source of truth for the taxonomy across both surfaces.
