# 20 — Front Matter, Formatting & References (process guide)

This file is not report *content* — it is a checklist for assembling the Word
document to the lecturer's formatting rules (guidelines 1–2, 12–23, 26).

## 20.1 Report structure & order

```
Cover Page                         (no page number)
Title Page                         (no page number)
Table of Contents                  (Roman numeral — auto-generated)
List of Tables                     (Roman — auto from table captions)
List of Figures                    (Roman — auto from figure captions)
List of Appendices                 (Roman)
List of Abbreviations              (Roman — Appendix B content, no table borders)
Chapter 1 — Introduction           (Arabic page 1 restarts here)
Chapter 2 — Literature Review
Chapter 3 — Methodology / System Analysis & Design
Chapter 4 — Implementation / Development
Chapter 5 — Testing / Evaluation / Results
Conclusion
References                          (not counted in the 10,000 words)
Appendix A — Full Test Cases        (headings right-aligned)
Appendix B — Additional Use-Case Diagrams
Appendix C — Module ER Fragments / Additional Diagrams
Appendix D — Additional Screenshots
Appendix E — Algorithm / Code Snippets
Appendix F — Meeting Minutes        (FINAL appendix: signing sheet first)
```

## 20.2 Word count — 10,000 words (Introduction → Conclusion only)

**Counted:** Chapters 1–5 + Conclusion.
**Not counted:** cover, title, all Roman-numeral front matter, References, all
Appendices.

Rough allocation (adjust to your emphasis):

| Chapter | Target words | What to keep in-chapter (link the rest to an appendix) |
|---|---|---|
| 1 Introduction | 1,200 | problem, gap, aim, RO/RQ, scope, novelty, structure |
| 2 Literature Review | 1,800 | 5–6 themed sub-sections + the gap table |
| 3 Methodology + Design | 2,600 | DSR, data sources, evaluation design; SRS *summary* table (full FR list → Appendix); **core** ER + 3 use-case + 3 activity + 3 sequence + 1 class diagram *with explanations* (extra diagrams → Appendix) |
| 4 Implementation | 2,000 | architecture, per-layer summary, the 6 key algorithms (2–3 flowcharts in-chapter), 5 screenshots; long code → Appendix E |
| 5 Testing / Evaluation / Results | 2,000 | testing strategy table, results tables, the ML comparison tables + selection rationale, NFR verification; the full 168-case list → Appendix A |
| Conclusion | 400 | summary, contributions, future work |
| **Total** | **≈ 10,000** | |

**Strategy:** write the chapter prose from files `01`–`19`, then move every long
table / full list / extra diagram to an appendix and replace it in the chapter
with 1–2 sentences + a hyperlinked "see Appendix X".

## 20.3 Appendix linking (guideline 3 — important)

Every time you move material to an appendix, reference it from the chapter with a
**clickable cross-reference**:

- In Word: Insert → Cross-reference → Reference type "Numbered item" or
  "Heading" → point at the appendix heading → "Insert as hyperlink".
- Pattern in the prose: *"…the platform was validated with 168 test cases; the
  complete catalogue is in **Appendix A**."* (the words "Appendix A" are the
  hyperlink).
- Tell the reader **what → why → evidence → where** before the link, never just
  dump.

## 20.4 Page numbering & section breaks (guidelines 16–18)

1. **Section break (Next Page)** after the Cover Page, after the Title Page, and
   before Chapter 1.
2. Cover + Title: header/footer → no page number.
3. Front-matter section: Insert → Page Number → Format → **i, ii, iii…**, start at
   `i`. Turn **OFF "Link to Previous"** so it doesn't inherit.
4. Chapter 1 section: Page Number → Format → **1, 2, 3…**, "Start at 1". Again
   turn **OFF "Link to Previous"**.
5. Appendices can be their own section if they need landscape / different
   formatting.
6. After every section break, check the header/footer "Link to Previous" toggle.

## 20.5 Headings & numbering (guideline 20)

- Use Word **Heading 1 / 2 / 3** styles with **multilevel list** numbering
  (`1`, `1.1`, `1.1.1`). Never type `1.1` manually.
- Chapter title = Heading 1 ("Chapter 1 – Introduction"); sub-sections Heading 2/3.
- Appendix headings: a separate style, **right-aligned**, named "Appendix A",
  "Appendix B" — *not* "Chapter 6", *not* "Appendix 1".

## 20.6 Figures & tables (guidelines 12–14)

- **Figure caption BELOW** the figure: `Figure 3.6: System Architecture` (use
  Insert → Caption, label "Figure").
- **Table caption ABOVE** the table: `Table 5.8: Severity-classifier algorithm
  comparison`.
- Numbering `Chapter.Number`, restarting each chapter (Word: Caption → Numbering
  → "Include chapter number").
- **Every** ER / UML / architecture / flowchart figure gets an explanation
  paragraph *before* it: what is shown, why, which module, assumptions, relation
  to the system (guidelines 14–15). Templates are in each source file.
- **All diagrams drawn in draw.io** — no AI-generated images (`appendix-D`).

## 20.7 References vs Bibliography (guidelines 21–23)

- Maintain a **List of References** (only sources you actually cite), *not* a
  broad bibliography.
- Use **Zotero** (recommended by the lecturer). Install the Zotero Word plugin.
- Add every source to your Zotero library as you read; insert citations via the
  plugin so each in-text citation is *linked* to a library item.
- The examiner may ask to see your Zotero library — keep it real and populated.
- Do **not** paste AI-generated reference strings that aren't backed by a Zotero
  entry.
- Citation style: whatever your programme mandates (commonly IEEE numeric for a
  computing thesis — matches your IEEE-track paper).

## 20.8 Consistency check before submission (guideline 30)

Run through `appendices/appendix-D-diagram-drawing-guide.md §10` — the table that
maps each artefact to what it must match (ER ↔ schema, use cases ↔ SRS, activity
↔ sequence, algorithm ↔ code ↔ flowchart, ML tables ↔ `*_info.json`, screenshots
↔ running system, citations ↔ reference list ↔ Zotero).

## 20.9 Viva readiness

Prepare spoken answers (no reading) for: what is your research · research gap ·
methodology · novelty · why this problem/methodology/algorithm/technology ·
research objectives · how you evaluated · limitations · contribution · how it
addresses the gap · why better than existing. Source material: `01 §viva`,
`03 §3.7`, `15` (per-model "why chosen"), `18 §18.5` (limitations).
