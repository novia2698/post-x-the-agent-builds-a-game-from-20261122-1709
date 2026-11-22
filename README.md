# The agent builds a game from one prompt

[![make.fun bounty](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/novia2698/post-x-the-agent-builds-a-game-from-20261122-1709/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/novia2698/post-x-the-agent-builds-a-game-from-20261122-1709/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)

One prompt went in. A game came out. This repo is the entry for the
[$20 make.fun bounty](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)
— top 10 places paid (1st $7, 2nd $3, 3rd–4th $2, 5th–10th $1).

## The one prompt

> Build me a tiny browser game: a neon snake that eats glowing orbs,
> speeds up every 5 orbs, shows the score, ends on game over, and
> restarts with one key — all in a single HTML file. Make it fun to watch.

No follow-ups. No fixes. Everything here was built from that one prompt,
in one session, while the transcript was rolling. See `PROMPT.md`.

## The game

`game/index.html` + `game/game.js` — Neon Snake. Eat the glowing orbs,
+10 points each, and the snake gets faster every 5 orbs. Hit a wall or
yourself and it is game over; press **R** to restart instantly. Arrows
or WASD to steer, **P** to pause.

Open `game/index.html` in a browser and play, or drive it headlessly:

```sh
node scripts/drive-game.mjs 17 /tmp/game-states.json
```

## The video

`out/post-x-video.mp4` (35 s, 1280x720) — the prompt typing itself out,
the agent working, then the finished game running on real frames from
the game logic (rendered by `scripts/render-video.py` from the headless
driver's states, not a mockup). It ends on make.fun's referral end card
from the press pack, with referral code `bpr1tvsc` typed into the field.

The post draft is in `post-draft.md`; the post's address goes in
`POST.json` once it is live on X. `main.ts` (Node 22) copies `POST.json`
to `/output` — that is all the entry program does.

## Build on make.fun

Come build with your own agent: https://make.fun/r/bpr1tvsc
