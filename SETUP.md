# Putting the site on Cloudflare — free, forever

You already have the project connected to GitHub. These steps replace the files and finish the setup.

Nothing here costs money and no card is needed.

---

## Step 1 — Create the storage first

Do this before anything else — the next step needs the id it gives you.

1. In Cloudflare, left menu: **Storage & Databases** → **KV**.
2. Press **Create a namespace** (or **Create instance**).
3. Name it `iemss-site`. Create.
4. You now see it listed with a long **Namespace ID** next to it — a line of letters and numbers.
   **Copy that id.**

---

## Step 2 — Put the id into the settings file

In the package there is a file called **`wrangler.jsonc`**. Open it in any text editor. Near the bottom:

    "kv_namespaces": [
      {
        "binding": "SITE",
        "id": "PASTE_YOUR_KV_NAMESPACE_ID_HERE"
      }
    ],

Replace `PASTE_YOUR_KV_NAMESPACE_ID_HERE` with the id you copied. Keep the quote marks around it.

While you are in there, check the name near the top matches your Cloudflare project:

    "name": "iem-uthm-student-section",

That is already correct for your project. Only change it if you renamed the project.

Save the file.

---

## Step 3 — Replace the files on GitHub

Your repository is `rajkevin111-cmd/IEM-UTHM-Student-Section`.

1. Open it on github.com.
2. Delete what is there now: tick everything → **Delete files** → **Commit changes**.
   (Nothing is lost — you still have the zip.)
3. Click **Add file** → **Upload files**.
4. Drag in **everything inside the new package** — `wrangler.jsonc`, `src`, `public`, `apps-script`, and the guides.
5. **Commit changes.**

> Drag the *contents* of the folder, not the folder itself. If the repository ends up with one folder inside it, the deploy will fail.

Cloudflare notices the push and deploys within a minute or two. Watch the **Deployments** tab — it should go green this time.

---

## Step 4 — Set your password

Open **`https://iem-uthm-student-section.<your-subdomain>.workers.dev/admin`**

The exact address is on the project's **Overview** tab in Cloudflare — it is the one ending in `.workers.dev`.

It asks you to create a password. Choose one, type it twice, and you are in.

**Write it down.** There is no reset email. If it is lost: Cloudflare → Storage & Databases → KV → `iemss-site` → delete the entry called `auth`, and the manager will ask for a new password next time.

---

## Step 5 — Test it

1. **Home page** tab → change the member count → **Save and publish**. Open the website in another tab and check the number changed.
2. **Past events** → click a photo box → pick a photo. It should replace within a few seconds.
3. **Settings** → *Earlier versions* → an entry from your test save should be listed.
4. Open the website → **Contact us** → send a message → check it reaches the Google Sheet and iemssuthm@gmail.com.

---

## Step 6 — Your own domain (optional)

The free `.workers.dev` address works forever.

To use your own: Cloudflare → your project → **Domains** → **Add**. Follow the prompts; the certificate is free and automatic.

If your current domain came bundled with the Hostinger plan, check whether you keep it after cancelling. Some bundled domains are tied to the subscription. A domain on its own is about RM40–60 a year from any registrar, and it is the only thing in this setup that ever costs money.

---

## What it costs

Nothing. The free allowance is far beyond a student chapter's use:

| | Free allowance | Likely use |
|---|---|---|
| Visitors | 100,000 requests a day | Hundreds |
| Saves and uploads | 1,000 a day | A handful |
| Storage | 1 GB | About 20 MB |

No card on file means no way to be charged by accident. If a limit is ever hit, saving pauses until midnight UTC.

---

## When something is wrong

**The deploy fails.** Open the failed build in Cloudflare and read the red text at the bottom.

- *"Missing entry-point"* or *"no such file src/index.js"* — the files went up inside a folder. Repository root should show `wrangler.jsonc`, `src` and `public` directly.
- *"KV namespace 'PASTE_YOUR...' is not valid"* — step 2 was missed.

**Saving says storage is not connected.** The id in `wrangler.jsonc` is wrong, or the deploy that included it has not finished.

**`/admin` is a blank page.** The `public/admin` folder did not upload.

**A photo will not upload.** Very large images can fail on an old phone; the browser shrinks them before sending, so try a laptop.

**The website shows old content.** Hard-refresh: Ctrl+Shift+R, or Cmd+Shift+R on a Mac.

**Something broke after an edit.** Cloudflare → Deployments → find the last deployment that worked → **Rollback**.

---

## Changing the files later

Edit them on GitHub and Cloudflare republishes within a minute. You never upload to Cloudflare directly.

Day-to-day content — events, photos, names, roster hours — does not touch GitHub at all. That goes through `/admin` and appears immediately.
