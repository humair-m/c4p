# Gaza Maps – Data Report

> Generated: 28 March 2026

---

## Summary

| Dataset | Records | Source |
|---------|---------|--------|
| Gaza Maps | 154 events | gazamaps.com |
| Martyred Journalists | 351 journalists | stopmurderingjournalists.com |
| IDF Leaflets | 101 leaflets | idfleaflets.com |
| Incitement | 104 quotes, 29 people, 12 orgs, 61 targets | stopmurderingjournalists.com/incitement |
| Zionist Quotes | 592 quotes from 183 people, 20 categories | zionism.observer |

**Total data points: 1,302+**

---

## 1. Gaza Displacement Maps

- **File:** `gaza-maps.jsonl`
- **Source:** [gazamaps.com](https://gazamaps.com)
- **Records:** 154 displacement events
- **Date Range:** Oct 8, 2023 → Feb 6, 2026
- **Fields:** id, date, source URL, image, displacement area data
- **Description:** Timeline of documented displacement and safety zone changes across Gaza, sourced from official IDF evacuation orders and UNRWA reports.

---

## 2. Martyred Journalists

- **Files:**
  - `public/martyrs-ungrouped.json` — 351 individual journalist records
  - `public/martyrs-grouped-by-weapons.json` — grouped by 4 weapon categories
  - `public/martyrs-grouped-by-location.json` — grouped by 6 locations
- **Source:** [stopmurderingjournalists.com](https://stopmurderingjournalists.com)
- **Records:** 351 journalists killed
- **Fields:** name (English/Arabic), date of martyrdom, image, number of family members killed, method of martyrdom, murdered at home (boolean)
- **Description:** Comprehensive record of every journalist killed in Gaza since October 2023, including method of killing, location, and whether they were murdered at home with family.

---

## 3. IDF Leaflets

- **File:** `public/idf-leaflets.json`
- **Source:** [idfleaflets.com](https://idfleaflets.com)
- **Records:** 101 leaflets (scraped from pages 1–102)
- **Fields:** id, first seen date, image URLs (front/back), flag type, translations
- **Description:** Archive of IDF-distributed leaflets dropped on Gaza, including evacuation orders, warnings, and propaganda materials. Each entry includes front/back images and the date first observed.

---

## 4. Incitement Against Journalists

- **File:** `public/incitement.json`
- **Source:** [stopmurderingjournalists.com/incitement](https://stopmurderingjournalists.com/incitement)
- **Records:**
  - 104 documented incitement quotes
  - 29 individual inciters (people)
  - 12 organizations
  - 61 targets (journalists/media)
- **Fields:** date, inciter name/role/image, quote text, source URL, screenshot URL, target(s)
- **Description:** Documented instances of incitement against journalists by Israeli officials, military figures, and media personalities. Each entry links the inciter to their specific targets with source citations and screenshots.

---

## 5. Zionist Quotes Database

- **File:** `public/zionism-quotes.json`
- **Source:** [zionism.observer/database](https://zionism.observer/database)
- **Records:**
  - 592 quotes from 183 people
  - 20 quote categories
- **Scraped:** 2026-03-28
- **Fields:** person name/slug/role/image, quote text, date, source URL, source name, permalink, categories
- **Top Categories:**

| Category | Count |
|----------|-------|
| Ethnic Cleansing | 136 |
| Genocidal Intent | 121 |
| Collective Punishment | 107 |
| Impunity | 99 |
| Dehumanization | 90 |
| War Crimes | 74 |
| Colonialism | 70 |
| Incitement | 59 |
| Two State Solution | 48 |
| Racism | 37 |
| Starvation | 33 |
| Destruction of Living Environment | 28 |
| Torture | 17 |
| Apartheid | 11 |
| Lying? | 10 |
| War Mongering | 9 |
| Antisemitism | 7 |
| Settlement | 3 |
| Genocide Denial | 2 |
| Confession | 1 |

- **Top Quoted Figures:**

| Person | Quotes | Role |
|--------|--------|------|
| Itamar Ben-Gvir | 31 | Minister of National Security |
| Bezalel Yoel Smotrich | 31 | Finance Minister |
| Benjamin Netanyahu | 29 | Prime Minister |
| Israel Katz | 23 | Minister of Defense |
| David Ben-Gurion | 20 | Israel's first Prime Minister |
| Nissim Vaturi | 15 | MK, Deputy Speaker |
| Benny Morris | 14 | Historian |
| Revital Tali Gotliv | 13 | Member of Knesset |
| Moshe Feiglin | 12 | Former MK |
| Amichay Eliyahu | 9 | Minister of Heritage |

- **Description:** An ever-growing database of quotes from Israeli leaders, politicians, military figures, journalists, academics, and public figures — organized by person and categorized by type (ethnic cleansing, genocidal intent, dehumanization, etc.). All quotes are sourced with citations to original media.

---

## Data Pipeline

| Step | Tool | Output |
|------|------|--------|
| Maps | Bundled JSONL dataset | `gaza-maps.jsonl` |
| Journalists | Fetched from API | `public/martyrs-*.json` |
| Leaflets | Python scraper (`/tmp/scrape_leaflets.py`) | `public/idf-leaflets.json` |
| Incitement | Python scraper (`/tmp/scrape_incitement.py`) | `public/incitement.json` |
| Zionist Quotes | Python scraper (`/tmp/scrape_zionism.py`) | `public/zionism-quotes.json` |

---

## Attributions

All data is sourced from publicly available databases maintained by independent organizations:

- **[Databases for Palestine](https://databasesforpalestine.org)** — Parent project behind multiple databases
- **[Stop Murdering Journalists](https://stopmurderingjournalists.com)** — Journalist martyrdom and incitement tracking
- **[IDF Leaflets](https://idfleaflets.com)** — Archive of IDF-distributed leaflets
- **[The Zionism Observer](https://zionism.observer)** — Quotes database (affiliated with Databases for Palestine)
- **[Gaza Maps](https://gazamaps.com)** — Displacement and safety zone mapping
