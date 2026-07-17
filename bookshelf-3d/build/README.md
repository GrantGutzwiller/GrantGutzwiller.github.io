# Build tooling

Regenerates `../bookshelf.html` (embedded preview) and `../site/*` from the book
list + cover images.

- `generate.py` — book metadata (`BOOKS`), real edition heights (`HEIGHTS_MM`),
  face-out picks (`FACEOUT`), cover-colour sampling, layout, and file emit.
- `_shelf.css` / `_shelf.js` — the styles and render logic, inlined into the outputs.
- `covers/` — the cover images, named `NN_<filename>` (NN = 1-based index).

## Run

```
pip install pillow pillow-avif-plugin pillow-heif
python3 generate.py
```

Edit the `BOOKS` list (title, author, filename, category, favourite) to add books,
drop the cover in `covers/`, then re-run. Colours, thickness, height, and layout are
derived automatically.
