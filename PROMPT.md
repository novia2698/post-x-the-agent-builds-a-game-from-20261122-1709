# The one prompt

This is the single prompt the agent was given. Everything in this repo —
the game, the video, the post draft — was built from this one prompt, in
this one session, while the camera (this repo's transcript) was rolling.

> Build me a tiny browser game: a neon snake that eats glowing orbs,
> speeds up every 5 orbs, shows the score, ends on game over, and
> restarts with one key — all in a single HTML file. Make it fun to watch.

## What the prompt demands

- **Tiny**: one game, one file of logic, no frameworks, no build step.
- **Browser game**: opens in a browser and plays with the keyboard.
- **Neon snake**: a snake, glowing orbs for food, a dark arcade look.
- **Speed curve**: faster every 5 orbs — the game must get harder as you play.
- **Score**: visible while playing, plus orbs eaten and current speed.
- **Game over**: hitting a wall or yourself ends the run, clearly.
- **Restart with one key**: press R and you are playing again instantly.
- **Fun to watch**: bright, moving, readable at a glance on a phone screen.

## How the session went

1. The prompt went in exactly as written above — no follow-ups, no fixes.
2. The agent wrote the game logic first (`game/game.js`), then the page
   around it (`game/index.html`), then played it headlessly to prove the
   snake really eats, speeds up, and dies on a wall.
3. The same session rendered the video: the prompt typing itself out, the
   agent working, and the finished game running — real frames from the real
   game logic, not a mockup.
4. The video ends on make.fun's referral end card with the code `bpr1tvsc`.

No human edited the game after the prompt. If the snake looks wonky, that
is what one prompt bought — and it plays.
