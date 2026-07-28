
Build a community + news + resource-hub website named "[SITE NAME]".

PURPOSE
A single trusted destination that (1) curates the most important, high-quality
resources available online on [TOPIC / NICHE], (2) publishes original news and
editorial coverage on the same topic, and (3) lets registered members discuss,
submit, and vet resources together.

CORE FEATURES
1. News / Blog Feed
   - Reverse-chronological articles with category, tags, author byline, read-time
   - Featured / pinned post slot at the top of the feed
2. Resource Library
   - Curated, filterable directory of external resources (tools, guides, official
     docs, datasets, courses) — each with a short description, tags, source link,
     and a "last verified" date
   - Vetted by staff and trusted community members before publishing
3. Community Layer
   - Member accounts and profiles
   - Discussion threads under every article and resource
   - Upvote / "helpful" reactions and a lightweight reputation or badge system for
     trusted contributors
4. Submission Flow
   - Public form for members to submit new resources for moderator review
5. Newsletter
   - Email capture for a periodic roundup of new resources + top news
6. Search & Filters
   - Full-text search across news + resources; filter by category, tag, date,
     and content type

SITE MAP
- Home — hero + latest news + featured resources + community highlights
- News / Blog — index + article detail page
- Resource Library — index + resource detail page
- Community / Discussions — index + thread page
- Submit a Resource — form
- About
- Contact

TONE
Editorially credible and calm — a hybrid of a respected trade publication and a
well-moderated community forum. Not clickbait, not overly casual. Every piece of
content should read like it was chosen or written by someone who actually knows
the field.

DESIGN LANGUAGE
Follow the design system in Part 2 below — same institutional-trust visual
language as our reference brand, re-tuned for long, frequently-scrolled,
text-dense pages rather than a short marketing site.
```



## PART 2 — Design System (adapted from the reference site's philosophy)

### Carried over from the reference design
- Sharp corners everywhere (no border-radius) — signals seriousness/credibility
- Hairline 1px borders instead of drop-shadows to define cards
- Alternating background bands to segment page rhythm
- One accent color reserved almost exclusively for calls-to-action
- Short, confident headings; body copy kept tight per block

### What changes for a content-heavy community/news site
| Reference site (marketing) | This site (content/community) |
|---|---|
| Navy dominates hero, feature sections, footer | Navy reserved for header, footer, and hero only — interior pages stay mostly white/cream for long-form readability |
| Few sections, generous whitespace | Dense, scannable card grids (article/resource lists) with tighter vertical rhythm |
| No user-generated content | Comment threads, avatars, badges, vote counts need dedicated components |
| Single CTA per section | Multiple concurrent actions per card (read, save, upvote, comment) |

### Color Palette
| Token | Approx. Hex | Usage |
|---|---|---|
| `--navy` | `#0B1B33` | Header, footer, hero band |
| `--gold` | `#F2B807` | Primary CTA, active tab/filter, upvote-active state |
| `--cream` | `#F7EFE1` | Section dividers, sidebar panels, featured-post band |
| `--white` | `#FFFFFF` | Default page/card background |
| `--ink` | `#12213B` | Headings, primary body text |
| `--muted-grey` | `#6B7280` | Meta text (dates, author, read-time), inactive tabs |
| `--success-green` | `#2F855A` | "Verified resource" / moderation-approved indicator |
| `--border` | `rgba(18,33,59,0.12)` | Card hairlines |

### Typography
- **Headings**: same bold geometric sans-serif as the reference brand; scale down for article titles vs. hero (hero = display size only on Home)
- **Body**: regular-weight sans-serif, slightly larger base size (16–18px) and increased line-height for long-form article readability
- **Meta text**: small, uppercase, letter-spaced, `--muted-grey` — used for dates, categories, read-time, author names

### Core Components

**News Article Card**
- Thumbnail (16:9) → category tag pill (gold outline) → bold title → 1-line excerpt → meta row (author · date · read-time)

**Resource Card**
- Small source-favicon or icon → bold resource name → 2-line description → tag pills → footer row: "Verified [date]" (green check) + outbound-link icon

**Community Thread Card**
- Avatar → thread title (bold) → excerpt of top comment → meta row (replies count · last activity · category)

**Tag Pill**
- Sharp-cornered, hairline border, uppercase small label; gold fill only when active/selected as a filter

**Vote / Reputation Control**
- Simple up-arrow + count, ink-colored default, gold when the user has voted
- Contributor badge: small square icon next to username once a reputation threshold is hit

**Newsletter Bar**
- Full-width cream or navy band (context-dependent), single email input + gold "Subscribe" button, placed after the main feed on Home and at the bottom of every article

**Filter/Search Bar**
- Sits above every index page (News, Resources, Community): search input + tag pills + sort dropdown, all sharp-cornered with hairline borders, consistent with card styling

### Page Flow Logic

1. **Home** — hero (mission statement, short) → latest news feed → featured/verified resources → community highlights → newsletter capture
2. **News Index → Article** — scannable card grid → full article with author, comments thread, related resources sidebar
3. **Resource Library → Resource Detail** — filterable grid → detail page with description, verification date, discussion, "related resources"
4. **Community Index → Thread** — recent/active threads → full thread with nested replies
5. **Submit a Resource** — short form (title, URL, category, description) → confirmation state ("pending moderator review")

This mirrors the reference site's trust-building funnel (**hook → mission → proof → product → people → action**), adapted so that "proof" and "product" are continuously refreshed by the community rather than fixed marketing claims.

### Reusable CSS Variable Block

```css
:root {
  --navy: #0B1B33;
  --gold: #F2B807;
  --cream: #F7EFE1;
  --white: #FFFFFF;
  --ink: #12213B;
  --muted-grey: #6B7280;
  --success-green: #2F855A;
  --border: rgba(18, 33, 59, 0.12);

  --font-heading: 'Inter', 'Helvetica Neue', sans-serif;
  --font-body: 'Inter', 'Helvetica Neue', sans-serif;

  --radius-card: 0px;
  --border-card: 1px solid var(--border);

  --section-padding-y: 64px;
  --container-max-width: 1200px;
  --content-max-width: 760px; /* for article body text */
}
```