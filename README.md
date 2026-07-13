# jonahrosenberg.work — portfolio

Static portfolio site served by Cloudflare Pages (root directory = repo root,
no build step). `functions/friend-counter.js` is a Pages Function backed by a
D1 database (binding `DB` → database `site_counters`) — the free 1:1
replacement for the old AWS Lambda + DynamoDB counter.

Deploy: connected to Cloudflare Pages; every push to `main` publishes.
D1 setup (once): create database `site_counters`, run `schema.sql`, add the
`DB` binding in the Pages project settings.
