# Running the appeal page

Written so that whoever picks this up in a year needs nothing from anyone.

## Every week or so

1. Add up what has come in this month: the Razorpay dashboard, the Danamojo
   dashboard, and anything banked directly.
2. Go to `/settings`, put the total in **Raised so far this month**, press save.
3. That is it. The page, the poster, the link preview and the share card are all
   already showing it.

The page says when it was last updated. After seven days it starts telling readers
the figure may be behind — so the cost of not updating is visible rather than
silent, which is the right way round.

## On the 1st of the month

The page rolls over on its own at midnight IST. It will show the new month with
the previous month's figures still in it, so:

1. Set the new **goal**.
2. Set **raised** back to whatever has come in since midnight — usually 0.
3. Change the headline if the month has a different message.

## When the goal is met

Nothing to do. The page notices, the seal changes, and the wording switches from
"₹4.6 lakh short" to "Funded." Leave it up for the rest of the month.

## Posting the appeal

`/poster` has the image, sized for Instagram and X, drawn from the current
figures. Download it and post it, or just post the link to the page — the link
preview is itself an image with the live total on it, so a link posted three weeks
apart shows two different, correct numbers.

## If something looks wrong

- **The number is stale.** Nobody has updated it. See above.
- **Saving does nothing.** The deployment has lost its key-value store. The
  settings screen says so in red. Reconnect it in the host's dashboard.
- **The settings screen will not open.** `ADMIN_PASSWORD` is not set on the
  deployment. The public page is unaffected.
- **The page is showing the wrong month.** The rollover uses Asia/Kolkata. If the
  host's clock is wrong, everything else will be too.

## If you want to stop using it

Delete the deployment. Nothing else is affected: it never held any of your
accounts, and no donation ever passed through it.

## If the person who built this is unreachable

Nothing here depends on them. It is MIT-licensed, has no paid services, no
accounts in anyone else's name, and no external dependencies beyond the host.
Any web developer can read it in an afternoon.
