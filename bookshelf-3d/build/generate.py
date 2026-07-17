# -*- coding: utf-8 -*-
"""Self-contained bookcase generator (CSS + JS embedded)."""
import base64, io, os, glob, json, random
from PIL import Image
import pillow_avif  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)                 # the bookshelf/ dir
COVERS = os.path.join(HERE, "covers")        # the cover images (this generator's set)

BOOKS = [
 ("The Analects","Confucius","the-analects-9.jpg","PHIL",False),
 ("Critique of Pure Reason","Immanuel Kant","51buLebyiJL._AC_UF1000,1000_QL80_.jpg","PHIL",False),
 ("Meditations","Marcus Aurelius","81DFDGzHZqL._AC_UF1000,1000_QL80_.jpg","PHIL",True),
 ("Beyond Good and Evil","Friedrich Nietzsche","9780679724650_p0_v2_s600x595.jpg","PHIL",False),
 ("Nicomachean Ethics","Aristotle","71sSYXkyTXL._AC_UF1000,1000_QL80_.jpg","PHIL",False),
 ("Ancient Greek Philosophers","An Anthology","9781667211640_p0_v3_s1200x630.jpg","PHIL",False),
 ("The Myth of Sisyphus","Albert Camus","61-M36Jrb0L._AC_UF1000,1000_QL80_.jpg","PHIL",False),
 ("Ethics in the Real World","Peter Singer","81Tf+u65RvL._AC_UF1000,1000_QL80_.jpg","PHIL",False),
 ("Thus Spoke Zarathustra","Friedrich Nietzsche","Thus Spoke.jpg","PHIL",False),
 ("Famine, Affluence, and Morality","Peter Singer","famine-affluence-morality.jpg","PHIL",False),
 ("The Passion of the Western Mind","Richard Tarnas","passion-western-mind.jpg","PHIL",False),
 ("The Brothers Karamazov","Fyodor Dostoevsky","brothers-karamazov.jpg","LIT",False),
 ("The Great Gatsby","F. Scott Fitzgerald","the-great-gatsby.jpg","LIT",True),
 ("Of Mice and Men","John Steinbeck","of-mice-and-men.jpg","LIT",False),
 ("The Road","Cormac McCarthy","the-road.jpg","LIT",False),
 ("A Farewell to Arms","Ernest Hemingway","a-farewell-to-arms.jpg","LIT",False),
 ("The Book Thief","Markus Zusak","the-book-thief.jpg","LIT",False),
 ("The Night Circus","Erin Morgenstern","the-night-circus.jpg","LIT",False),
 ("1984","George Orwell","1984.jpg","LIT",False),
 ("All the Light We Cannot See","Anthony Doerr","all-the-light.jpg","LIT",False),
 ("A Man Called Ove","Fredrik Backman","a-man-called-ove.jpg","LIT",False),
 ("Theo of Golden","Allen Levi","theo-of-golden.jpg","LIT",False),
 ("The Alchemist","Paulo Coelho","the-alchemist.jpg","LIT",False),
 ("Atlas Shrugged","Ayn Rand","atlas-shrugged.jpg","LIT",False),
 ("The Invisible Life of Addie LaRue","V.E. Schwab","addie-larue.jpg","LIT",False),
 ("Circe","Madeline Miller","circe.jpg","LIT",False),
 ("The Song of Achilles","Madeline Miller","song-of-achilles.jpg","LIT",False),
 ("Wild Dark Shore","Charlotte McConaghy","wild-dark-shore.jpg","LIT",False),
 ("The Divine Comedy","Dante Alighieri","divine-comedy.jpg","LIT",False),
 ("The Plague","Albert Camus","the-plague.jpg","LIT",False),
 ("Beowulf","Seamus Heaney","beowulf.jpg","LIT",False),
 ("Foundation","Isaac Asimov","RCMizTI58k3tmM0khkvTqINx7nw.avif","SCIFI",False),
 ("The Three-Body Problem","Cixin Liu","818l7Ujz5-L._AC_UF1000,1000_QL80_.jpg","SCIFI",False),
 ("Dune","Frank Herbert","YlWDT0vFEPnurHsYCN0oBOVE5E.avif","SCIFI",True),
 ("Red Rising","Pierce Brown","ATfWZWZg0qYlCAyfBU9KRTqqE.jpg","SCIFI",False),
 ("Ready Player One","Ernest Cline","ready-player-one.jpg","SCIFI",False),
 ("The Player of Games","Iain M. Banks","716NJX7AE5L._AC_UF1000,1000_QL80_.jpg","SCIFI",False),
 ("This Is How You Lose the Time War","El-Mohtar & Gladstone","oOLZvex7ETLQSMC7kuJALBW1NLM.avif","SCIFI",False),
 ("Blindsight","Peter Watts","blindsight.jpg","SCIFI",False),
 ("The Time Machine","H.G. Wells","the-time-machine.jpg","SCIFI",False),
 ("Project Hail Mary","Andy Weir","project-hail-mary.jpg","SCIFI",False),
 ("Ender's Game","Orson Scott Card","enders-game.jpg","SCIFI",False),
 ("Leviathan Wakes","James S.A. Corey","leviathan-wakes.jpg","SCIFI",False),
 ("The Hitchhiker's Guide to the Galaxy","Douglas Adams","hitchhikers-guide.jpg","SCIFI",False),
 ("Eragon","Christopher Paolini","eragon.jpg","FANT",False),
 ("The Black Prism","Brent Weeks","NnxkAdmeZivBlWyq0iwmGz2lqc.jpg","FANT",False),
 ("The Way of Kings","Brandon Sanderson","fsbCzFCmfj4ZVThSASu4WsWlk.avif","FANT",True),
 ("Katabasis","R.F. Kuang","0az76CWMscq9Sceop9ersmPRM.avif","FANT",False),
 ("The Shadow of What Was Lost","James Islington","vgxu1cH88RLvl0BZUIia6GltiI4.avif","FANT",False),
 ("Mistborn: The Final Empire","Brandon Sanderson","mistborn.jpg","FANT",False),
 ("The Blade Itself","Joe Abercrombie","the-blade-itself.jpg","FANT",False),
 ("The Lies of Locke Lamora","Scott Lynch","lies-of-locke-lamora.jpg","FANT",False),
 ("The Name of the Wind","Patrick Rothfuss","the-name-of-the-wind.jpg","FANT",False),
 ("Assassin's Apprentice","Robin Hobb","assassins-apprentice.jpg","FANT",False),
 ("The Eye of the World","Robert Jordan","eye-of-the-world.jpg","FANT",False),
 ("The Warded Man","Peter V. Brett","the-warded-man.jpg","FANT",False),
 ("Blood Song","Anthony Ryan","blood-song.jpg","FANT",False),
 ("Prince of Thorns","Mark Lawrence","prince-of-thorns.jpg","FANT",False),
 ("The Hobbit","J.R.R. Tolkien","the-hobbit.jpg","FANT",False),
 ("American Gods","Neil Gaiman","american-gods.jpg","FANT",False),
 ("The Library at Mount Char","Scott Hawkins","library-at-mount-char.jpg","FANT",False),
 ("Principles for Dealing with the Changing World Order","Ray Dalio","71-WJgHWC1L._AC_UF1000,1000_QL80_.jpg","WORLD",False),
 ("The Almanack of Naval Ravikant","Eric Jorgenson","almanack-naval-ravikant.jpg","WORLD",False),
 ("Steve Jobs","Walter Isaacson","syi5PJWdB5hK4tz1GCkyLDhLc.avif","WORLD",True),
 ("Chip War","Chris Miller","chip-war.jpg","WORLD",False),
 ("Nudge","Thaler & Sunstein","nudge.jpg","WORLD",False),
 ("Atomic Habits","James Clear","atomic-habits.jpg","WORLD",False),
 ("Leonardo da Vinci","Walter Isaacson","N96debEB9dwzTOCH5tZ7tWTu4.jpg","WORLD",False),
 ("Who Is Michael Ovitz?","Michael Ovitz","who-is-michael-ovitz.jpg","WORLD",False),
 ("Why Fish Don't Exist","Lulu Miller","Fish.jpg","WORLD",False),
 ("Sapiens","Yuval Noah Harari","716E6dQ4BXL._AC_UF1000,1000_QL80_.jpg","WORLD",False),
 ("The Operator","Tom King","the-operator.jpg","WORLD",False),
 ("The Coddling of the American Mind","Lukianoff & Haidt","coddling-american-mind.jpg","WORLD",False),
 ("Creative Capital","Spencer E. Ante","hpKFuMWaDHgZbEYf11Gv5XoPs.jpg","WORLD",False),
]
CAT_LABEL={"PHIL":"Philosophy","LIT":"Literature","SCIFI":"Science Fiction","FANT":"Fantasy","WORLD":"The Real World"}
CAT_ORDER=["PHIL","LIT","SCIFI","FANT","WORLD"]
# No shelf labels — order the whole collection as one thematic run and slice
# it into equal shelves, so similar books stay neighbours (like a real shelf)
# and every shelf comes out the same length.
SPECTRUM=["PHIL","WORLD","LIT","SCIFI","FANT"]
NSHELVES=3
PAGES={"The Analects":160,"Critique of Pure Reason":800,"Meditations":260,"Beyond Good and Evil":240,
 "Nicomachean Ethics":350,"Ancient Greek Philosophers":400,"The Myth of Sisyphus":210,"Ethics in the Real World":360,
 "Thus Spoke Zarathustra":340,"Famine, Affluence, and Morality":100,"The Passion of the Western Mind":550,
 "The Brothers Karamazov":800,"1984":330,"The Great Gatsby":180,"Of Mice and Men":110,"A Farewell to Arms":330,
 "The Road":290,"The Book Thief":550,"The Night Circus":510,"All the Light We Cannot See":540,"A Man Called Ove":340,
 "Theo of Golden":380,"The Alchemist":190,"Atlas Shrugged":1170,"The Invisible Life of Addie LaRue":450,"Circe":400,
 "The Song of Achilles":380,"Wild Dark Shore":420,"The Divine Comedy":800,"The Plague":310,"Beowulf":220,"Foundation":250,
 "The Three-Body Problem":400,"Dune":690,"Red Rising":380,"Ready Player One":380,"The Player of Games":310,
 "This Is How You Lose the Time War":210,"Blindsight":380,"The Time Machine":120,"Project Hail Mary":480,
 "Ender's Game":340,"Leviathan Wakes":580,"The Hitchhiker's Guide to the Galaxy":220,"Eragon":510,"The Black Prism":640,
 "The Way of Kings":1000,"Katabasis":540,"The Shadow of What Was Lost":700,"Mistborn: The Final Empire":540,
 "The Blade Itself":530,"The Lies of Locke Lamora":720,"The Name of the Wind":660,"Assassin's Apprentice":460,
 "The Eye of the World":780,"The Warded Man":450,"Blood Song":590,"Prince of Thorns":370,"The Hobbit":310,
 "American Gods":590,"The Library at Mount Char":390,"Principles for Dealing with the Changing World Order":560,
 "The Almanack of Naval Ravikant":250,"Steve Jobs":660,"Chip War":460,"Nudge":320,"Atomic Habits":320,
 "Leonardo da Vinci":600,"Who Is Michael Ovitz?":380,"Sapiens":450,"The Operator":560,
 "The Coddling of the American Mind":350,"Creative Capital":300,"Why Fish Don't Exist":240}

def find_file(fn):
    san=fn.replace(' ','_').replace('/','_').replace(',','_')
    for f in glob.glob(os.path.join(COVERS,"*")):
        if os.path.basename(f).split('_',1)[-1]==san: return f
    return None
def palette(im):
    q=im.convert("RGB").resize((60,90)).quantize(colors=8,method=Image.MEDIANCUT).convert("RGB")
    c={}
    for px in list(q.getdata()): c[px]=c.get(px,0)+1
    r=[k for k,_ in sorted(c.items(),key=lambda kv:-kv[1])]
    mids=[k for k in r if 24<(0.299*k[0]+0.587*k[1]+0.114*k[2])<236] or r
    dom=mids[0]
    # no white-white spines: a pale low-saturation cover would blend into the cream
    # page-block when the book tips forward. Deepen it to a warm mid tone (hue kept).
    lum=0.299*dom[0]+0.587*dom[1]+0.114*dom[2]
    if lum>195 and (max(dom)-min(dom))<55:
        dom=tuple(int(c*0.60) for c in dom)
    light=(0.299*dom[0]+0.587*dom[1]+0.114*dom[2])>150
    return dom, light
def hexc(c): return "#%02x%02x%02x"%c
def data_uri(im,h=560,q=68):
    # WebP at a tighter size/quality: visually identical in the zoom, roughly half
    # the bytes of the old 620px JPEGs — the whole page is these images
    im=im.convert("RGB"); w=int(im.width*h/im.height); im=im.resize((w,h),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,"WEBP",quality=q,method=6)
    return "data:image/webp;base64,"+base64.b64encode(b.getvalue()).decode()
def spine_uri(im):
    im=im.convert("RGB"); w=max(1,int(im.width*0.16))
    s=im.crop((0,0,w,im.height)).resize((64,420),Image.LANCZOS)
    b=io.BytesIO(); s.save(b,"JPEG",quality=90,optimize=True)
    return "data:image/jpeg;base64,"+base64.b64encode(b.getvalue()).decode()
def sh(s):
    h=2166136261
    for c in s: h=((h^ord(c))*16777619)&0xffffffff
    return h
# real representative print-edition heights (mm): mass-market ~172-180,
# trade ~198-210, hardcover fiction ~210-215, large nonfiction ~235-240
HEIGHTS_MM={
 "The Analects":180,"Critique of Pure Reason":198,"Meditations":180,"Beyond Good and Evil":180,
 "Nicomachean Ethics":198,"Ancient Greek Philosophers":200,"The Myth of Sisyphus":198,
 "Ethics in the Real World":210,"Thus Spoke Zarathustra":198,"Famine, Affluence, and Morality":180,
 "The Passion of the Western Mind":205,"The Brothers Karamazov":198,"1984":178,"The Great Gatsby":190,
 "Of Mice and Men":180,"A Farewell to Arms":198,"The Road":210,"The Book Thief":205,"The Night Circus":203,
 "All the Light We Cannot See":210,"A Man Called Ove":203,"Theo of Golden":215,"The Alchemist":198,
 "Atlas Shrugged":178,"The Invisible Life of Addie LaRue":203,"Circe":210,"The Song of Achilles":198,
 "Wild Dark Shore":215,"The Divine Comedy":198,"The Plague":198,"Beowulf":200,"Foundation":178,
 "The Three-Body Problem":210,"Dune":178,"Red Rising":203,"Ready Player One":203,"The Player of Games":178,
 "This Is How You Lose the Time War":198,"Blindsight":172,"The Time Machine":180,"Project Hail Mary":240,
 "Ender's Game":172,"Leviathan Wakes":178,"The Hitchhiker's Guide to the Galaxy":172,"Eragon":210,
 "The Black Prism":178,"The Way of Kings":178,"Katabasis":240,"The Shadow of What Was Lost":178,
 "Mistborn: The Final Empire":178,"The Blade Itself":198,"The Lies of Locke Lamora":178,
 "The Name of the Wind":178,"Assassin's Apprentice":178,"The Eye of the World":178,"The Warded Man":178,
 "Blood Song":178,"Prince of Thorns":178,"The Hobbit":198,"American Gods":203,"The Library at Mount Char":203,
 "Principles for Dealing with the Changing World Order":240,"The Almanack of Naval Ravikant":210,
 "Steve Jobs":240,"Chip War":235,"Nudge":210,"Atomic Habits":213,"Leonardo da Vinci":240,
 "Who Is Michael Ovitz?":235,"Sapiens":235,"The Operator":235,"The Coddling of the American Mind":235,
 "Creative Capital":235,"Why Fish Don't Exist":210}
def geo(t):
    p=PAGES.get(t,320)
    thick=int(max(28,min(70,22+p*0.05)))
    # height from the real edition size (px = mm * 0.87 → ~150-209px)
    h=int(round(HEIGHTS_MM.get(t,200)*0.87))
    return thick,h

# books turned cover-out (user's picks) — Famine is a thin essay, shown as a stack instead
FACEOUT={"The Myth of Sisyphus","The Road",
 "The Divine Comedy","Dune","The Player of Games","The Way of Kings",
 "The Shadow of What Was Lost","The Eye of the World","Steve Jobs","Chip War","1984"}
# books forced into a lying stack regardless of position
STACK_ME={"Famine, Affluence, and Morality"}

records=[]
for title,author,fn,cat,fav in BOOKS:
    path=find_file(fn)
    if not path: raise SystemExit("MISSING "+fn)
    im=Image.open(path); dom,light=palette(im); thick,h=geo(title)
    records.append({"title":title,"author":author,"cat":cat,"favorite":title in FACEOUT,
      "spineColor":hexc(dom),"textColor":"#1a1714" if light else "#f5f2ec","thick":thick,"h":h,
      "cover_real":"Bookshelf/"+fn,"cover_uri":data_uri(im)})

OBJECTS=["plant","books","vase","bust"]
def bd(r,ck): return {"title":r["title"],"author":r["author"],"cover":r[ck],
    "spineColor":r["spineColor"],"textColor":r["textColor"],"thick":r["thick"],"h":r["h"],
    "journal":r.get("journal",False),"href":r.get("href","")}
# a quiet personal notebook shelved among the books — clicking it goes to its page.
# it participates in layout like any book so the shelves still balance.
JOURNALS=[{"title":"My Travels","author":"a travel log","journal":True,"href":"travels",
    "favorite":False,"spineColor":"#8a6f4e","textColor":"#f2e8d2","thick":34,"h":152,
    "cover_uri":"","cover_real":""}]
def build_layout(recs,ck):
    shelves=[]; obj_k=0
    ordered=[r for cat in SPECTRUM for r in recs if r["cat"]==cat]
    # tuck the journal(s) in near the top-left — present but not first, like a
    # private notebook that ended up between the philosophy hardbacks
    for k,j in enumerate(JOURNALS): ordered.insert(2+k, j)
    N=len(ordered)
    # split into NSHELVES CONTIGUOUS groups of ~equal RENDERED width (not equal
    # count) so every shelf fills the case evenly. shelf_w replays the same
    # face/stack/object logic used below to get each candidate shelf's real width.
    # a stack lies flat: its height is the sum of the books' thicknesses. Stacks are
    # only ever 3–5 books tall (slim books reach 5, chunky ones stop lower).
    MAXSTACK=205
    def stack_run(grp, i, want=5, maxh=MAXSTACK):
        run=[]; j=i; n=len(grp); h=0
        while j<n and len(run)<want and not grp[j]["favorite"] and not grp[j].get("journal") and grp[j]["title"]!="Why Fish Don't Exist" and (j==i or grp[j]["title"] not in STACK_ME):
            t=grp[j]["thick"]
            if run and h+t>maxh: break
            run.append(grp[j]); h+=t; j+=1
        return run, j
    # one pass that BOTH the width estimate and the real build share, so they can
    # never disagree. Books only: stacks are 3–5 tall, and neither two stacks nor
    # two cover-forward books ever stand side by side.
    def layout_slots(grp, is_top=False):
        slots=[]; n=len(grp); i=0; since_s=0
        while i<n:
            r=grp[i]
            prev_stack = bool(slots) and slots[-1]["kind"]=="stack"
            prev_face  = bool(slots) and slots[-1]["kind"]=="face"
            if (r["title"] in STACK_ME or since_s>=6) and not prev_stack:
                run,j=stack_run(grp,i)
                if len(run)>=3:               # only commit a real 3–5 high stack
                    slots.append({"kind":"stack","books":[bd(b,ck) for b in run]}); i=j; since_s=0; continue
            if r["favorite"]:
                slot={"kind":"spine","book":bd(r,ck),"lean":0} if prev_face else {"kind":"face","book":bd(r,ck)}
                slots.append(slot); i+=1; since_s+=1; continue
            slots.append({"kind":"spine","book":bd(r,ck),"lean":0}); i+=1; since_s+=1
        return slots
    def group_w(slots):   # rendered width of a shelf's books
        t=0
        for s in slots:
            k=s["kind"]
            if k=="spine": t+=s["book"]["thick"]
            elif k=="face": t+=round(s["book"]["h"]*0.64)
            elif k=="stack": t+=max(b["h"] for b in s["books"])
        return t
    # books only — no object width to budget for
    OW=[0,0,0,0]
    INF=float("inf"); seg={}
    def sw(a,b,is_top):
        key=(a,b,is_top)
        if key not in seg: seg[key]=group_w(layout_slots(ordered[a:b], is_top))
        return seg[key]
    # choose the 3 contiguous cuts that minimise the spread (widest - narrowest),
    # so all four shelves come out ~equal width and each fills the case
    best=None; bestspread=INF
    for b1 in range(1,N-1):
        for b2 in range(b1+1,N):
            ws=[sw(0,b1,True), sw(b1,b2,False), sw(b2,N,False)]
            sp=max(ws)-min(ws)
            if sp<bestspread: bestspread=sp; best=(b1,b2)
    b1,b2=best
    groups=[ordered[0:b1],ordered[b1:b2],ordered[b2:N]]
    for grp in groups:
        shelves.append({"label":"","slots":layout_slots(grp)})
    # Fill every shelf to the widest shelf's width so the case (width:max-content)
    # reads flush with no empty space on the right. The nudge to spine thickness is
    # a fraction of a pixel per book, so centred titles stay put.
    SLACK=0
    target=max(group_w(s["slots"]) for s in shelves)
    for s in shelves:
        slots=s["slots"]
        spines=[sl for sl in slots if sl["kind"]=="spine"]
        gap=target-group_w(slots)
        if spines and gap>SLACK:
            add=(gap-SLACK)/len(spines)
            for sl in spines: sl["book"]["thick"]=round(sl["book"]["thick"]+add,1)
        # Every book stands straight and edge-to-edge — no lean.
    return shelves

CSS=open(os.path.join(HERE,"_shelf.css")).read(); JS=open(os.path.join(HERE,"_shelf.js")).read()
MARKUP='''<nav class="navbar"><a href="/" class="logo">Grant Gutzwiller</a>
<div class="nav-links"><a href="essays">Essays</a><a href="projects">Projects</a>
<a href="bookshelf" class="active">Bookshelf</a><a href="gallery">Gallery</a></div></nav>
<header class="page-header"><span class="page-descriptor">Select &amp; Current Reads</span></header>
<p class="tab-caption" id="caption"></p>
<section class="view active"><div class="bookcase" id="bookcase"></div></section>
<footer class="footer"><span>&copy; Grant Gutzwiller</span><span>Claremont, CA · Prototype</span></footer>'''

def emit(ck):
    return "const shelves = "+json.dumps(build_layout(records,ck),ensure_ascii=False)+";\n"+JS
open(os.path.join(REPO,"bookshelf.html"),"w").write(
    "<style>\n"+CSS+"\n</style>\n"+MARKUP+"\n<script>\n"+emit("cover_uri")+"\n</script>\n")
os.makedirs(os.path.join(REPO,"site"),exist_ok=True)
open(os.path.join(REPO,"site","bookshelf.css"),"w").write(CSS)
open(os.path.join(REPO,"site","bookshelf.js"),"w").write("// drop-in for grantgutzwiller.com\n"+emit("cover_real"))
open(os.path.join(REPO,"site","bookshelf.html"),"w").write(
    '<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8">'
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    '<title>Bookshelf — Grant Gutzwiller</title>'
    '<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="bookshelf.css"></head>'
    '<body class="loaded">\n'+MARKUP+'\n<script src="bookshelf.js"></script><script src="script.js"></script></body></html>')
sz=os.path.getsize(os.path.join(REPO,"bookshelf.html"))
lay=build_layout(records,"cover_real")
print("preview %.0f KB | books %d | shelves %d"%(sz/1024,len(records),len(lay)))
for shf in lay:
    k={}
    for s in shf["slots"]: k[s["kind"]]=k.get(s["kind"],0)+1
    print("  %-16s"%shf["label"],k)
