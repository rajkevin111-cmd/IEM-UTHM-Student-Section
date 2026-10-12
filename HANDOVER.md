# Looking after the IEMSS UTHM website

You do not need to know anything about websites to keep this one up to date. Everything is done through one page, in a normal browser.

---

## Signing in

Go to the website address and add `/admin` on the end:

    https://your-site.workers.dev/admin

**The first time anyone opens it,** it asks you to choose a password. Pick one, write it down somewhere safe, and keep it. That is now the password for the site manager.

After that, the same address asks for the password and lets you in.

> If the password is ever lost, there is no "forgot password" email. Someone with the Cloudflare login has to go to Storage & Databases → KV → `iemss-site`, delete the entry called `auth`, and the manager will ask for a new password on the next visit.

---

## How it works

The manager has eight tabs across the top, one for each part of the website. You change what you want, then press **Save and publish** at the bottom.

That is the whole thing. The moment you press save, the live website shows your changes. There is nothing to upload, nothing to install, and no waiting.

The bar at the bottom tells you where you stand:

- **Everything is saved** — nothing left to do
- **Not saved yet** (gold) — you have changed something and have not pressed save
- **Saved and live — 12 Oct 2026, 9:14pm** — it went through

If you try to close the page with unsaved changes, the browser will stop and ask you first.

---

## The eight tabs

**Home page** — the big headline, the main photo, the "Who we are" writing, the member count, and the countdown clock.

**Upcoming events** — events with a date, and events with no date yet. The next three with dates also appear on the home page automatically.

**Past events** — the archive, newest first. Each event holds three photos.

**Duty roster** — the grid of office hours.

**Committee** — advisors, high committee, and the six departments.

**Membership page** — the fee notice, what members get, how to register, and the common questions.

**Contact & office** — email, office, links, and where contact form messages are sent.

**Settings** — change the password, and bring back earlier versions.

---

## The jobs you will actually do

### Add an event

Go to **Upcoming events** → **+ Add an event**. A blank one appears at the bottom. Fill in the name, pick the date from the calendar, and add the place. Press **Save and publish**.

Use the **↑** and **↓** buttons to put it in the right order.

If the date is not fixed yet, add it under *Events with no date yet* instead, and move it up to the dated list later.

### Move a finished event into the archive

There is no automatic move — do it in two steps:

1. **Past events** → **+ Add a past event**. Fill in the name, the date as you want it written (for example `19 June 2026`), the place, and which year to group it under.
2. **Upcoming events** → find the old one → **Delete**.
3. Save.

### Add photos from an event

Open **Past events**, find the event, and click any of the three photo boxes. Pick a photo from your computer or phone. It uploads, shrinks itself, and appears straight away.

You do **not** need to resize or rename anything. Any JPG, PNG or WEBP works, up to 12 MB. To remove one, hover over it and click the **×**.

### Change the main photo on the home page

**Home page** tab → click the big photo box. A wide photo works best, with the people on the **right-hand side** — the headline sits over the left.

### Update the duty roster

**Duty roster** tab. Click any square to turn that hour on or off. When a square is on, you can type the name of whoever is on duty in it, or leave it blank to just show the office as open.

Once the roster is confirmed for the session, clear the two boxes under *Notice above the roster* — that removes the yellow "not yet confirmed" banner from the page.

### Change committee names at the start of a session

**Committee** tab. Change the names in place. Use **+ Add** and **Delete** where positions have changed, and **↑ ↓** to reorder.

The four high committee names also show on the home page — that happens by itself.

### Update the member count

**Home page** tab → *Member count*.

---

## If something goes wrong

**You made a mess and want to undo it.** Settings → *Earlier versions*. Every save keeps a copy of what came before, and the last 30 are listed with the date and time. Pick one and press **Bring this one back**.

**A save failed.** The message at the top says why. Nothing is changed on the website unless the save succeeds — the old version stays live. Keep the page open and try again.

**The website looks unchanged after saving.** Press Ctrl+Shift+R (Cmd+Shift+R on a Mac) to force the browser to re-read the page.

**You cannot sign in.** Check the password carefully — it is case sensitive. Signing in deliberately takes a moment after a wrong try, so give it a second before deciding it failed.

**Saving says storage is not connected.** Something was changed in the Cloudflare settings. Whoever set the site up should re-read SETUP.md step 3.

---

## Who can get in

Only someone with the password. Visitors see no sign of the manager, there is no link to it anywhere on the site, and search engines are told to ignore it — you have to know to type `/admin`.

When you hand over to the next committee, give them the address and the password, and point them at this page. Then change the password once they are set up, or ask them to.

---

## Where messages from the contact form go

Two places at once, automatically:

- A new row in the **Google Sheet** — timestamp, name, email, topic, and the message
- An **email to iemssuthm@gmail.com** — and replying to that email goes straight back to the student

The sheet is the one that matters at handover: it keeps the whole history, so the next committee inherits every message instead of it sitting in one person's inbox.

Both are already set up. The settings are on the **Contact & office** tab, at the bottom — leave them alone unless someone rebuilds the Google script.

---

## Where the website lives

It is hosted free on Cloudflare, with the files kept on GitHub. Nothing is paid monthly and there is no bill that can lapse.

You do not need either of those accounts for day-to-day work — adding events, photos, names and roster hours all happens in the manager. They matter only if the site's design needs changing, which is a job for someone comfortable with code.
