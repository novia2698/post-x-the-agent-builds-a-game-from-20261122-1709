# Renders the bounty video from real game states (scripts/drive-game.mjs
# output) plus typed-prompt and agent-working scenes, ending on make.fun's
# referral end card with our code typed into its field.
#
# Layout (1280x720, 30 fps, 35 s total):
#   0-8s    the one prompt types itself out, character by character
#   8-14s   the agent working: terminal lines appearing as it builds
#   14-31s  the finished game running, rendered from real game states
#   31-35s  game keeps running under the referral end card (last 2.5 s),
#           clip blurs + desaturates, code bpr1tvsc typed into the field
#
# Usage: python3 scripts/render-video.py
#   reads /tmp/game-states21.json and /tmp/card-frames/f*.png
#   writes out/post-x-video.mp4

import json
import subprocess
import textwrap

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H, FPS = 1280, 720, 30
TOTAL_S = 35
BG = (11, 11, 22)
GREEN = (57, 255, 20)
PINK = (255, 45, 149)
WHITE = (242, 242, 247)
GREY = (157, 157, 184)
DIM = (109, 109, 138)
INK = (25, 20, 25)

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_B = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def text_wrapped(draw, text, fnt, max_w):
    """Wrap text to pixel width max_w, return list of lines."""
    words = text.split(" ")
    lines, cur = [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


PROMPT = (
    "Build me a tiny browser game: a neon snake that eats glowing orbs, "
    "speeds up every 5 orbs, shows the score, ends on game over, and "
    "restarts with one key \u2014 all in a single HTML file. Make it fun to watch."
)

WORK_LINES = [
    "$ agent  \u2014  one prompt in, game out",
    "> writing game/game.js ............ 270 lines",
    "> writing game/index.html ......... done",
    "> playing it headless ............. orbs eaten, speed rising",
    "> wall hit -> GAME OVER ........... press R, it restarts",
    "> rendering this video ............ ffmpeg",
]

GAME = json.load(open("/tmp/game-states21.json"))
FRAMES = GAME["frames"]
GRID_W, GRID_H, CELL = 24, 14, 40
OX, OY = (W - GRID_W * CELL) // 2, 110

CARD_FRAMES = 75  # 2.5 s at 30 fps
CARD_START = 32.5
CARD_REST = 1.067  # field at rest this far into the card
CODE = "bpr1tvsc"
CODE_SCALE = 1280 / 1920


def draw_game_frame(base, st):
    d = ImageDraw.Draw(base)
    f_title = font(MONO_B, 34)
    title = "NEON SNAKE"
    tw = d.textlength(title, font=f_title)
    d.text(((W - tw) / 2, 16), title, font=f_title, fill=GREEN)
    f_hud = font(MONO_B, 24)
    hud = f"SCORE {st['score']}    ORBS {st['orbs']}    SPEED {st['speed']:.1f}/s"
    hw = d.textlength(hud, font=f_hud)
    d.text(((W - hw) / 2, 62), hud, font=f_hud, fill=WHITE)
    d.rectangle([OX - 2, OY - 2, OX + GRID_W * CELL + 2, OY + GRID_H * CELL + 2],
                outline=(38, 38, 77), width=2)
    for gx in range(1, GRID_W):
        d.line([(OX + gx * CELL, OY), (OX + gx * CELL, OY + GRID_H * CELL)],
               fill=(35, 35, 58))
    for gy in range(1, GRID_H):
        d.line([(OX, OY + gy * CELL), (OX + GRID_W * CELL, OY + gy * CELL)],
               fill=(35, 35, 58))
    fx = OX + st["food"][0] * CELL + CELL // 2
    fy = OY + st["food"][1] * CELL + CELL // 2
    for r, col in ((26, (110, 18, 64)), (20, (170, 25, 95)), (14, (220, 35, 130))):
        d.ellipse([fx - r, fy - r, fx + r, fy + r], fill=col)
    d.ellipse([fx - 9, fy - 9, fx + 9, fy + 9], fill=PINK)
    n = len(st["snake"])
    for i, (sx, sy) in enumerate(st["snake"]):
        t = 0 if n <= 1 else i / (n - 1)
        col = (round(57 + (34 - 57) * t), round(255 + (211 - 255) * t),
               round(20 + (255 - 20) * t))
        pad = 2 if i == 0 else 4
        d.rounded_rectangle(
            [OX + sx * CELL + pad, OY + sy * CELL + pad,
             OX + (sx + 1) * CELL - pad, OY + (sy + 1) * CELL - pad],
            radius=9, fill=col)
    f_small = font(MONO, 16)
    hint = "arrows / WASD to steer  \u00b7  R restart  \u00b7  P pause"
    hw = d.textlength(hint, font=f_small)
    d.text(((W - hw) / 2, 684), hint, font=f_small, fill=DIM)
    return base


def frame_at(f):
    t = f / FPS
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    if t < 8.0:
        f_head = font(MONO_B, 26)
        head = "ONE PROMPT. NO FOLLOW-UPS."
        hw = d.textlength(head, font=f_head)
        d.text(((W - hw) / 2, 60), head, font=f_head, fill=GREEN)
        f_body = font(MONO, 30)
        lines = text_wrapped(d, PROMPT, f_body, 1000)
        full = "\n".join(lines)
        shown = full[: int(t / 8.0 * len(full) * 1.15)]
        y = 170
        for line in shown.split("\n"):
            d.text((140, y), line, font=f_body, fill=WHITE)
            y += 46
        if int(t * 2) % 2 == 0 and shown:
            last = shown.split("\n")[-1]
            cx = 140 + d.textlength(last, font=f_body) + 4
            cy = y - 46
            d.rectangle([cx, cy + 4, cx + 16, cy + 34], fill=GREEN)
        f_sub = font(MONO, 20)
        sub = "the agent gets exactly this \u2014 nothing else"
        sw = d.textlength(sub, font=f_sub)
        d.text(((W - sw) / 2, 620), sub, font=f_sub, fill=GREY)
        return img
    if t < 14.0:
        f_head = font(MONO_B, 26)
        head = "THE AGENT WORKS \u2014 WHILE YOU WATCH"
        hw = d.textlength(head, font=f_head)
        d.text(((W - hw) / 2, 60), head, font=f_head, fill=GREEN)
        f_term = font(MONO, 26)
        elapsed = t - 8.0
        for i, line in enumerate(WORK_LINES):
            if elapsed >= i * 0.9:
                d.text((120, 170 + i * 62), line, font=f_term,
                       fill=GREEN if line.startswith("$") else WHITE)
        if int(t * 2) % 2 == 0:
            shown_count = min(len(WORK_LINES), int(elapsed / 0.9) + 1)
            last = WORK_LINES[shown_count - 1]
            cx = 120 + d.textlength(last, font=f_term) + 6
            cy = 170 + (shown_count - 1) * 62
            d.rectangle([cx, cy + 4, cx + 14, cy + 30], fill=GREEN)
        return img
    gi = min(int((t - 14.0) * FPS), len(FRAMES) - 1)
    st = FRAMES[gi]
    draw_game_frame(img, st)
    if st.get("ate"):
        f_bang = font(MONO_B, 30)
        bang = "+10"
        bw = d.textlength(bang, font=f_bang)
        d.text(((W - bw) / 2, 640), bang, font=f_bang, fill=PINK)
    if t >= CARD_START:
        ct = t - CARD_START
        k = min(1.0, ct / 0.8)
        img = img.filter(ImageFilter.GaussianBlur(radius=19 * k))
        img = ImageEnhance.Color(img).enhance(1.0 - 0.65 * k)
        ci = min(int(ct * FPS), CARD_FRAMES - 1)
        card = Image.open(f"/tmp/card-frames/f{ci + 1:03d}.png").convert("RGBA")
        img = Image.alpha_composite(img.convert("RGBA"), card).convert("RGB")
        if ct >= CARD_REST:
            typed = CODE[: min(len(CODE), int((ct - CARD_REST) / 0.08) + 1)]
            d2 = ImageDraw.Draw(img)
            d2.rectangle([287, 461, 293, 515], fill=(255, 255, 255))
            f_code = font(MONO_B, 41)
            d2.text((288, 463), typed, font=f_code, fill=INK)
    return img


def main():
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
           "-preset", "medium", "-movflags", "+faststart",
           "out/post-x-video.mp4"]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(TOTAL_S * FPS):
        proc.stdin.write(frame_at(f).tobytes())
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        raise SystemExit(f"ffmpeg failed with code {proc.returncode}")
    print(f"rendered {TOTAL_S * FPS} frames -> out/post-x-video.mp4")


if __name__ == "__main__":
    main()
