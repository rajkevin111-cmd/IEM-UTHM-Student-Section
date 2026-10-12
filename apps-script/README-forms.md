# Contact form — where the messages go

**Both.** Every message is saved to a Google Sheet *and* emailed to iemssuthm@gmail.com, from one script. The sheet is the record the committee can sort, assign and mark as replied; the email is the notification so nobody has to remember to check the sheet.

Netlify Forms stays switched on underneath as a backup, so a message still lands somewhere even if the script is down or a future committee forgets to renew it.

## Why this way

| | Email only | Sheet only | This setup |
|---|---|---|---|
| Someone notices a new message | yes | no, only if they check | yes |
| Survives a committee handover | no, it's in one inbox thread | yes | yes |
| Can be sorted, filtered, marked replied | no | yes | yes |
| Monthly limit | — | — | Netlify free tier caps at 100/month; the script has no practical cap |

## Setup — about ten minutes, once

1. **Make the spreadsheet.** Create a new Google Sheet on the IEMSS account. Copy its ID from the address bar — it's the long string between `/d/` and `/edit`.

2. **Open the script editor.** In that sheet: Extensions → Apps Script.

3. **Paste the code.** Delete whatever is in `Code.gs` and paste in the contents of `Code.gs` from this folder. At the top, replace `PASTE_YOUR_SPREADSHEET_ID_HERE` with the ID from step 1. Save.

4. **Run `testSetup` once.** Pick `testSetup` from the function dropdown and press Run. Google asks for permission — approve it (choose the IEMSS account, then Advanced → Go to project). Check that a test row appeared in the sheet, then delete that row.

5. **Deploy it.** Deploy → New deployment → gear icon → Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**

   Press Deploy and copy the web app URL. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

6. **Paste the URL into the site.** Open `content.js`, find `formEndpoint` inside the `contact` block, and put the URL there:

       contact: {
         ...
         formEndpoint: "https://script.google.com/macros/s/AKfy…/exec",

7. **Deploy the site and send yourself a test message.**

## If you change the script later

Apps Script keeps the old version live until you redeploy. After editing, use Deploy → Manage deployments → pencil icon → Version: New version → Deploy. The URL stays the same, so you don't need to touch `content.js`.

## Troubleshooting

**Nothing arrives.** Check `formEndpoint` in `content.js` ends with `/exec`, not `/dev`. The `/dev` URL only works while you are logged in.

**Emails stop.** A Gmail account can send about 100 emails a day through Apps Script. The sheet still records everything, so nothing is lost.

**Messages in the sheet but no email.** Open the script, Executions tab, look for the failed run. Usually it's the permission prompt from step 4 never being completed.

**"Who has access" reset to "Only myself".** That blocks the form. Redeploy with **Anyone**.
