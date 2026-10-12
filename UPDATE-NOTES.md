# What changed in this package

This is your updated site — your content and all 81 photos — now with the site manager built in.

## Fixed: nine photos that were broken on the live site

These files had a capital `.JPG` extension. Hostinger's server is Linux, which treats `color-run-1.JPG` and `color-run-1.jpg` as two different files, so the site was asking for a file that did not exist and showing an empty placeholder instead.

Affected events: **Engineering Color Run** (all 3), **Resume Clinic** (all 3), **Welcoming Night 25/26** (2 of 3), **Renewable Energy Industrial Talk** (1 of 3).

All nine are renamed to lowercase in this package. Nothing for you to do.

## Fixed: the Past events page was 146 MB

Every photo has been resized to 1800px on the long edge and re-saved — the same treatment the site manager now applies automatically to anything you upload.

| | Before | After |
|---|---|---|
| All photos | 146 MB | 18 MB |

Three photos from the IEM YES National Summit were 13–17 MB each on their own. On campus wifi the Past events page would have taken minutes to load, and on phone data it would have eaten someone's quota. They look the same on screen.

Photos taken sideways on a phone are also rotated the right way up now.

## Moved: free hosting on Cloudflare

No more monthly bill. The site manager has been rebuilt to run on Cloudflare's free tier — same dashboard, same eight tabs, same instant saves. See **SETUP.md**.

Upper-case photo prefixes work (`MARVEX2026`, `NS2026`) — the manager accepts them when you upload.

## Still to do

**There is no `assets/hero.jpg`.** The home page currently falls back to a plain dark blue behind the headline. Once the site is live, open the **Home page** tab in the manager and click the big photo box to add one. A wide shot with people on the right works best — the headline sits over the left.

## Your content is unchanged

27 past events, 6 upcoming, 6 with dates to be announced, the full committee, the duty roster, 4228 members, and your Apps Script contact form settings — all exactly as you left them.
