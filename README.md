# Card Table

A small GitHub Pages site for tracking 400, Tarneeb, Likha, and Tawle scores
with login, per-user game history, and profile editing — backed by a Google
Sheet.

## Setup

1. **Google Sheet**: a sheet with two tabs:
   - `Users`: columns `username | firstName | lastName | password | phone | image | isAdmin`
   - `History`: columns `type | date | players | teams | rounds | totals | winningTeam | finalScore | recordedBy`
     (Tawle rows also use `players`, `winner`, `loser`.)

2. **Apps Script Web App**: deployed from the sheet (Extensions → Apps Script).
   Use the code in `apps-script.js` — it handles:
   - `GET ?action=getUsers` / `?action=getHistory`
   - `POST action=addGame` — appends a game result
   - `POST action=updateUser` — lets a user update their own row (username,
     name, phone, image, password). `isAdmin` is never editable this way.

   **If you already deployed an earlier version**: open Extensions → Apps
   Script, replace the contents with `apps-script.js`, save, then
   **Deploy → Manage deployments → edit (pencil) → New version → Deploy**.
   The `/exec` URL stays the same.

   Deploy with access "Anyone".

3. **`common.js`**: `SHEET_API_URL` is set to your deployed Apps Script `/exec` URL.

4. **GitHub Pages**: push all files to a repo, enable Pages (Settings → Pages →
   deploy from `main`, root).

## Managing users

Add/edit rows in the `Users` tab of the Sheet directly, or have each person
edit their own row via the **Profile** page (linked from the user chip in the
top-right of every page). Set `isAdmin` to `TRUE`/`FALSE` manually in the
Sheet — it's not editable from the Profile page.

⚠️ Passwords are stored in plain text in the Sheet — fine for a casual
private group sharing the Sheet, not for anything sensitive.

## How it works

- `index.html` — login, checks credentials via the Apps Script (`getUsers`)
- `app.html` — game picker + link to history
- `history.html` — game history, filterable by game type and opponent.
  **Access control**: a user only sees games they personally took part in
  (matched by first/last name against the recorded players). If they've
  never played a recorded game, they see no history at all.
- `profile.html` — edit your own username, name, phone, image, and password
- `game.html?type=tarneeb|400|likha|tawle` — scoring / dice UI, saves via `addGame`
- `common.js` — shared session + Sheet API helpers
- `style.css` — shared styling
- `apps-script.js` — reference copy of the Apps Script backend code

## History filters

On `history.html`:
- **Game**: filter to a specific game type (Tarneeb / 400 / Likha / Tawle), or "All games".
- **With player**: a dropdown of every other player you've shared a game with
  (pooled across your games of the selected type), to find all games you
  played against/with a specific person.

## Game rules implemented

- **Tarneeb**: 4 players (2 teams). Each round: pick the bidding team, their
  bid (7-12, or 26 = "bid all 13"), and tricks won by the bidding team.
  Success → bidder scores tricks won (26 if bid 26 and won all 13), opponents
  score 0. Failure → bidder loses points equal to the bid, opponents score
  `13 - tricks won`. Team wins at 31+.
- **400**: 4 players (2 teams), each scored individually. Each round, each
  player picks a bid (2-10, no bid = 0) and Made/Failed. Points follow the
  table: 2→2, 3→3, 4→4, 5→10, 6→12, 7→14, 8→16, 9→27, 10→30; failure
  subtracts instead of adds. A team wins as soon as either of its players
  individually reaches 41+.
- **Likha**: 4 players (2 teams), each scored individually, add-only. Each
  round's 4 player scores must sum to exactly 36. A team **loses** as soon as
  either of its players individually reaches 101+ (lowest score wins).
- **Tawle**: 2 players (backgammon-style). Dice roller (animated, with double
  detection). Either player can be declared the winner, which saves the
  result (winner + loser) to history.

## Celebrations

When a game ends, a brief fireworks animation plays (respects
`prefers-reduced-motion`).
