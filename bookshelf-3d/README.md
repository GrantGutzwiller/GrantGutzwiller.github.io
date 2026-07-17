# Bookshelf — redesign

A realistic 3D bookcase for [grantgutzwiller.com/bookshelf](https://grantgutzwiller.com/bookshelf):
a warm **walnut bookcase** you look at, not a list. **74 books** stand on four shelves —
mostly spine-out (each spine colour-matched and shaded from the real cover, title only),
a handful turned **face-out** with full cover art, and a few laid in **stacks**, with plants,
flowers and a bust tucked through the rows. **Hover a book** to lift its cover straight-on.

Books are grouped loosely by kind (philosophy → how-the-world-works → literature → sci-fi →
fantasy) and flow across the shelves with no visible labels, like a real bookcase. Each book
is sized from its **real print edition** (a mass-market paperback is visibly shorter than a
big hardcover), and thickness follows its page count.

Sections: Philosophy 11 · How the World Works 13 · Literature 20 · Science Fiction 13 · Fantasy 17.

## Files

| File | What it is |
| --- | --- |
| `bookshelf.html` | **Self-contained preview** (covers embedded as data URIs). Open in any browser. |
| `site/bookshelf.html` | Page markup for the real site (loads the css/js below + your `styles.css`/`script.js`). |
| `site/bookshelf.css` | Styles for the walnut bookcase. |
| `site/bookshelf.js` | Book data + render, pointing at your real `/Bookshelf` covers. |
| `site/Bookshelf/` | The cover images — drop these into your site's `/Bookshelf` folder. |
| `build/` | The generator (`generate.py`, `_shelf.css`, `_shelf.js`, `covers/`) that produces the above. |

## Porting to the live site

1. Copy the images in `site/Bookshelf/` into your site's `/Bookshelf` folder.
2. Replace `bookshelf.html`, `bookshelf.css`, `bookshelf.js` with the ones in `site/`.

## Editing the shelf

Everything lives in the `BOOKS` list in `build/generate.py` — `(title, author, cover,
section, favourite)`. Add/remove a line, drop its cover in `build/covers/`, and re-run
`python3 build/generate.py` to regenerate the preview + site drop-in. Sections are
`PHIL · WORLD · LIT · SCIFI · FANT`. A book is turned face-out if it's in the `FACEOUT`
set; each book's height comes from `HEIGHTS_MM` (real edition heights).

Face-outs (11): The Myth of Sisyphus · The Road · The Divine Comedy · Dune ·
The Player of Games · The Way of Kings · The Shadow of What Was Lost ·
The Eye of the World · Steve Jobs · Chip War · Why Fish Don't Exist.

## Notes

- Spines show the **title only** (no author), sized to fill the spine and shaded to read as
  a rounded, dimensional book; a book's cover only shows on hover, on face-outs, and in the
  turned/hybrid styles.
- Spine colours are sampled from each real cover, so the shelf stays coherent even though
  most books show only a spine.
- The bookcase scales to fit any screen; on phones each shelf becomes a swipeable row.
