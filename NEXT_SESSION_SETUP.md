# Setup Checklist: What to Do Before Next Session

Do **Part A** once. Then each step in **Part B** lists what to have ready when we
reach it. Tick boxes as you go.

---

## Part A: One-time setup (do all of this before the next session)

### A1. Move to your desktop
Chrome, the SD card and local files are only reachable from your computer, so
the next session should run there, not in the cloud.
- [ ] Install the **Claude desktop app** and sign in with the same account (lounafawaz5@gmail.com)
- [ ] Open Claude Code in the desktop app and point it at this project. Either clone the repo
      `lounafawaz5-cmd/laservision` (branch `claude/laser-vision-zeiss-strategy-tbslie`)
      or ask me to clone it on first run. The brief and this checklist live there,
      so I start with full context.

### A2. Claude in Chrome (analytics and research)
- [ ] Install the **Claude** extension from the Chrome Web Store
- [ ] Sign into the extension with the same Claude account
- [ ] In Chrome, make sure you're logged in to:
  - [ ] Instagram: **Laser Vision** and **Zeiss** (both added in the account switcher)
  - [ ] **Meta Business Suite** (business.facebook.com) for both brands. It has deeper
        Instagram and Facebook numbers than Instagram's own site, and I'll use it first.
  - [ ] **TikTok** for both brands (TikTok Studio has the analytics)
  - [ ] Facebook (the pages for both brands)
  - [ ] Optional: YouTube and LinkedIn (for research; logged in shows more)
- [ ] When the session starts, approve the Chrome connection when asked

### A3. Connectors (claude.ai → Settings → Connectors, or https://claude.ai/customize/connectors)
- [ ] **Trello**: connect with the account that owns both boards
- [ ] **Google Drive**: for raw footage, the strategy doc and carousel references
- [ ] **Canva**: already connected. Just confirm it's still on.
- Connectors only load when a session **starts**, so connect them first, then open the session.

### A4. Plugins (install from the cards in this chat, or the plugin directory)
- [ ] **Remotion** (reel editing)
- [ ] **Social Media Skills** (optional: hooks, scripts, captions, carousel frameworks)

### A5. Software on your computer (for reel editing)
- [ ] **Node.js** (LTS version) from nodejs.org. Remotion needs it.
- [ ] Enough free disk space for raw footage plus renders (aim for 50 GB+)
- [ ] I'll install Remotion itself and the transcription tool (Whisper, which handles English and Arabic) when we get there

### A6. Files to gather
- [ ] **Consultant strategy doc**: put it in Google Drive or have it ready to upload
- [ ] **Brand basics, for each brand**: logo files (PNG with transparent background + SVG if you have it),
      brand colors (hex codes), fonts (English **and** Arabic), any Zeiss corporate brand guidelines
- [ ] **Carousel references**: one folder per brand in Google Drive:
      `Carousel References/Laser Vision/` and `Carousel References/Zeiss/`
- [ ] **Peer accounts you already like**: 3–5 per brand, any platform (links are enough)

### A7. Things to decide or find out (no rush, but needed)
- [ ] **Remotion license**: free only if the company has 3 or fewer employees.
      Otherwise the clinic or store needs a Remotion company license.
- [ ] **Canva plan**: which plan are you on? Some automation (auto-filling templates)
      depends on it.
- [ ] **Mac or Windows?** Changes small details of the footage setup.

---

## Part B: Step by step (what we do and what I need from you)

### Step 1: Trello (read only first)
**You:** Trello connected (A3). Tell me the two board names.
**Me:** Read both boards and report the lists, labels and card structure, plus what's
in progress. I propose a card template (format, platform, language, hook, script,
caption, cover text, shoot date, status) and change nothing until you approve.

### Step 2: Strategy doc
**You:** The doc in Drive or uploaded.
**Me:** Read it and summarize the direction, pillars and audiences for each brand.
List the gaps the analytics and research need to fill.

### Step 3: Analytics on your own accounts (Chrome)
**You:** Chrome set up and logged in (A2). Stay nearby in case a login or
2-factor prompt appears.
**Me:** Go through Meta Business Suite, Instagram, TikTok Studio and Facebook for each
brand. Pull every post's format, date, hook, caption, length, language, views,
reach, watch time, likes, comments, saves and shares. Deliverable: a report per brand with
- top and bottom performers and what they have in common
- best hooks, caption styles, formats, lengths, languages and posting times
- a "replicate this" playbook

All raw numbers are saved as a spreadsheet in the repo so we can compare month to month.

### Step 4: Peer and competitor research (Chrome)
**You:** Your starter list of accounts (A6). Nothing else.
**Me:** Browse Instagram, TikTok, YouTube, Facebook and LinkedIn for similar laser
eye centers and eyewear brands, local and international, in English and Arabic.
Every account, post, topic and format worth borrowing goes in
`references/README.md` **with its link** and a note on why it works.
Deliverable: a topic bank and a format bank for each brand.

### Step 5: Content calendar and topics → Trello
**You:** Approve the topic list and the Trello card template.
**Me:** Build the month (about 3 posts per week per brand across IG, TikTok and FB) and create
the Trello cards.

### Step 6: Scripting (discussion first)
**You:** Your view on video length, style and tone for each brand. Point me to old reels
you consider "on brand" (I can pull them from Instagram).
**Me:** Transcribe past reels (English and Arabic) to learn your voice, then we agree
on a **script template per brand**: structure, length, hook rules, the
English/Arabic decision. After that every script follows it.

### Step 7: Captions and cover text (standard per brand)
**You:** Feedback on drafts until it feels right.
**Me:** A fixed caption formula per brand (hook line, body, CTA, hashtags, language rules,
medical-claim rules for Laser Vision) and a cover-text formula (word count, style).
Saved in the repo as the standard.

### Step 8: Reel editing setup (discussion, then build)
**You:** Footage from your iPad/SD card/Drive copied into one place (see the folder
setup below). Then a back-and-forth with me on reel types.
**Me:** Propose a short list of **reel templates**, e.g. talking head + captions,
doctor Q&A, patient story, before/after, product showcase, listicle/tips,
trend format. We decide which ones are shared templates and which are one-offs.
I build each template once in Remotion: branded captions in English **and Arabic (right-to-left)**,
intro/outro, music slot, text hooks. Then every reel is: you drop clips in a folder → I
transcribe, cut, caption and render → you review → I revise.

**Footage folder setup (on your computer or in Drive):**
```
Footage/
  Laser Vision/
    2026-11-03 topic-name/     ← raw clips for one reel
  Zeiss/
    2026-11-05 topic-name/
```
The iPad syncs into this through iCloud Drive or AirDrop. SD card clips get copied in after each shoot.

### Step 9: Carousel system (discussion, then build)
**You:** Reference folders (A6). Your preferred way of working.
**Me:** Study the references and write a design guide per brand (layouts, type, colors,
slide patterns). Then we pick a workflow. Leading option:
1. Carousel text goes on the Trello card in a fixed format (Slide 1: …, Slide 2: …)
2. I read the card and generate the slides from the brand's template
3. The design link or exported images are attached back to the Trello card for review

How I generate them is decided in this step: Canva templates (your team can still edit)
or code-rendered slides (pixel-exact, easy Arabic layout).

### Step 10: Weekly planning (last)
Fixed days per task, e.g. a Laser Vision shoot day and an edit day. This will
grow to cover newsletters, pop-ups and other marketing later.

### Step 11: The monthly-planning skill
Everything above gets packaged into one skill: analytics refresh → research refresh →
topics → Trello cards → scripts, captions and cover text, so a monthly planning sit-down is fast.

---

## How to open the next session
Paste this:
> Read PROJECT_BRIEF.md and NEXT_SESSION_SETUP.md. Trello, Chrome, Drive and Canva
> are connected. Let's start Step 1.
