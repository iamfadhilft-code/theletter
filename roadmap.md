# Roadmap — The Letter 2.0 rebuild

Reference: user brief (THE_LETTER_2.0 complete rebuild) + uploaded screenshots.

## Backend (Lovable Cloud)
- [ ] Migration: tables (profiles, blogs, thoughts, winners, submissions, user_roles) + indexes + GRANTs
- [ ] RLS: anon read published/active only; admin write via has_role; submissions pending-only insert
- [ ] Storage bucket `media` + policies (public read, admin write)
- [ ] Admin role provisioning (user signs up at /auth, then promoted via SQL — no invented credentials)

## Design system
- [ ] src/styles.css: pale-blue background, orange #FF650A accent, navy text, white rounded cards, Archivo/Inter fonts

## Public pages
- [ ] / (home: hero, latest blogs, featured, profiles teaser, footer)
- [ ] /blogs (+ search, pagination/load-more)
- [ ] /blogs/$slug (article page + related)
- [ ] /profiles (+ filter/search)
- [ ] /profiles/$id
- [ ] /thought
- [ ] /winners
- [ ] /search
- [ ] /submit (form → submissions table, pending)
- [ ] /auth (admin sign-in page, customized)

## Admin (under _authenticated, gated by has_role)
- [ ] Overview dashboard
- [ ] Blog CRUD (cover + multiple images, draft/publish, featured, order)
- [ ] Profile CRUD
- [ ] Thought CRUD
- [ ] Winner CRUD
- [ ] Submissions review/approve→publish/reject
- [ ] Image management

## Finishing
- [ ] SEO head metadata per route, robots.txt, sitemap
- [ ] Loading/empty/error states everywhere
- [ ] Playwright end-to-end verification
- [ ] Docs: deployment + env notes in README
