# Task Atlas - Methods

## TL;DR
Most labor analysis starts at the occupation level. This project starts at the task level.  
The goal is to map where wage value actually sits inside work activities, then estimate where LLMs have the highest technical exposure to accelerate those activities.

This is not a forecast of job loss. It is a map of where technical capability and economic value overlap.

---

## What This Measures
Task Atlas measures three things at once:

1. Where U.S. wage value concentrates across specific work activities.
2. Which activities have higher or lower LLM task exposure.
3. How those activity-level patterns roll up to occupations.

The central unit is the **Detailed Work Activity (DWA)**, not the job title.  
That distinction matters. Jobs are bundles. Exposure happens inside the bundle.

---

## Core Idea
The useful question is not "which jobs are exposed?"  
The useful question is "which high-value tasks inside those jobs are exposed?"

Two occupations can have similar average exposure and still be economically very different if one is concentrated in high-value exposed tasks and the other is not.  
By pushing the analysis down to activity level first, then rolling up, this project avoids flattening that difference.

---

## Data Inputs
This dashboard combines three layers:

1. **O*NET task/activity data** to define what work is being done.
2. **BLS OEWS wage and employment data** to size the labor-market value tied to occupations.
3. **GPTs-are-GPTs task exposure labels (E0/E1/E2)** to estimate where LLMs can materially reduce task time at similar quality.

These are joined through custom mapping tables that allocate occupation wage value into activities.

---

## How The Mapping Works

### 1) Occupation Wage Bill
Each occupation gets a wage bill estimate from employment and wage statistics.

### 2) Occupation -> Activity Allocation
That wage bill is distributed across the activities used by that occupation, weighted by activity relevance and intensity.

### 3) Activity-Level Exposure
Each activity receives an LLM exposure score using GPTs-are-GPTs task labels and the same task-to-activity mapping structure.

### 4) Aggregation Back Up
Once every activity has both economic value and exposure, results are rolled back up into occupation-level summaries and portfolio-style views.

This sequencing is intentional: task first, occupation second.

---

## Exposure Interpretation (Important)
The exposure score reflects **technical potential for time reduction at comparable quality**.

It does **not** directly measure:
- adoption speed
- managerial willingness to deploy
- regulatory permission
- full task replacement
- employment outcomes

In other words, a high score means "this is technically exposed," not "this will disappear."

---

## Why This Framing Matters
Most dashboards stop at "high exposure" lists.  
That is directionally useful but economically incomplete.

Task Atlas adds two constraints:

1. **Value concentration**: a small share of activities carries a disproportionate share of wages.
2. **Task granularity**: exposure and value can diverge inside the same occupation.

This gives a better read on where productivity leverage is likely to matter economically, not just where model capability is high in the abstract.

---

## Limitations
No single score captures implementation reality. Main constraints:

1. O*NET activity structure is standardized and may lag firm-specific workflows.
2. Exposure labels are capability signals, not realized deployment data.
3. Aggregation smooths variation across firms, geographies, and operating models.
4. Complementary tooling, process redesign, and governance can dominate outcomes even at identical exposure levels.

This should be read as an economic map of plausible leverage, not a deterministic labor forecast.

---

## How To Use It (Investor Lens)
Use the output as a screening layer:

1. Identify high-value activity clusters with medium-high or high LLM exposure.
2. Separate exposure from capture: ask who owns workflow, data, and decision rights.
3. Distinguish threshold functions from differentiating functions before inferring margin impact.

The strongest signal is not raw exposure.  
It is high exposure + high value + clear path to capture.

