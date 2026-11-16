"""Builds the 'Your eyes at every age' carousel (6 slides, 1080x1350).
Run: python3 build.py && node render.js"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FONTS = ROOT / "brand/fonts/Outfit"
LOGO = ROOT / "brand/laservision/logo-white.svg"
TOTAL = 6

# Brand colors (brand/laservision/GUIDELINES.md)
NAVY, BLUE, TEAL, MINT, GRAY, WHITE = "#00303F", "#005D83", "#30A4BF", "#B6DFE5", "#F1F2F2", "#FFFFFF"

WA = ('<svg viewBox="0 0 24 24" class="wa"><path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>')

# ---------- Illustrations: one flat style (round heads, rounded shoulders, brand blues) ----------
def person(x, base, s=1.0, body=BLUE, head=MINT, hair=None, glasses=False, grey=False):
    """Flat figure: head circle + rounded-shoulder bust. (x, base) = bottom centre."""
    r = 62 * s; w = 220 * s; h = 210 * s
    hy = base - h - r * 0.75
    out = [f'<path d="M{x-w/2},{base} v{-h*0.55} a{w/2},{h*0.45*1.0} 0 0 1 {w},0 v{h*0.55} z" fill="{body}"/>',
           f'<circle cx="{x}" cy="{hy}" r="{r}" fill="{head}"/>']
    if hair:
        out.append(f'<path d="M{x-r},{hy} a{r},{r} 0 0 1 {2*r},0 q{-r*0.9},{-r*0.35} {-2*r},0 z" fill="{hair}"/>')
    if grey:
        out.append(f'<path d="M{x-r},{hy-2*s} a{r},{r} 0 0 1 {2*r},0 q{-r},{-r*0.55} {-2*r},0 z" fill="{GRAY}"/>')
    if glasses:
        gr = r * 0.30; gy = hy + r * 0.08
        out.append(f'<g fill="none" stroke="{NAVY}" stroke-width="{6*s}"><circle cx="{x-r*0.38}" cy="{gy}" r="{gr}"/>'
                   f'<circle cx="{x+r*0.38}" cy="{gy}" r="{gr}"/><path d="M{x-r*0.08},{gy} h{r*0.16}"/></g>')
    return "".join(out)

def eye(cx, cy, w, stroke=WHITE, sw=8, iris=TEAL):
    h = w * 0.42
    return (f'<path d="M{cx-w/2},{cy} Q{cx},{cy-h*1.25} {cx+w/2},{cy} Q{cx},{cy+h*1.25} {cx-w/2},{cy} z" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{h*0.62}" fill="{iris}"/><circle cx="{cx}" cy="{cy}" r="{h*0.28}" fill="{NAVY}"/>'
            f'<circle cx="{cx+h*0.22}" cy="{cy-h*0.22}" r="{h*0.1}" fill="{WHITE}"/>')

def ground():
    return f'<ellipse cx="540" cy="1150" rx="430" ry="26" fill="{NAVY}" opacity=".35"/>'

ART = {}
# Cover: three generations
ART[1] = (ground() + person(300, 1150, 1.05, body=BLUE, grey=True, glasses=True)
          + person(780, 1150, 1.15, body=TEAL)
          + person(545, 1150, 0.72, body=NAVY, head=MINT, hair=BLUE)
          + eye(540, 690, 220))
# Kids: child + eye chart
chart = (f'<rect x="610" y="610" width="250" height="420" rx="22" fill="{GRAY}"/>'
         f'<g font-family="Outfit" font-weight="700" fill="{NAVY}" text-anchor="middle">'
         f'<text x="735" y="760" font-size="120">E</text><text x="735" y="860" font-size="70">F P</text>'
         f'<text x="735" y="930" font-size="44">T O Z</text><text x="735" y="985" font-size="28">L P E D</text></g>')
ART[2] = ground() + chart + person(390, 1150, 0.82, body=TEAL, hair=BLUE)
# 20s & 30s: person behind laptop
laptop = (f'<path d="M300,1085 h480 l-28,-200 h-424 z" fill="{GRAY}"/>'
          f'<rect x="260" y="1085" width="560" height="30" rx="15" fill="{MINT}"/>'
          + eye(540, 990, 130, stroke=NAVY, sw=7))
ART[3] = ground() + person(540, 1150, 1.25, body=BLUE, hair=NAVY) + laptop
# 40s & 50s: reading glasses, book held at arm's length
book = (f'<g transform="rotate(-8 770 860)"><path d="M660,820 q55,-25 110,0 q55,-25 110,0 v150 q-55,-25 -110,0 q-55,-25 -110,0 z" fill="{GRAY}"/>'
        f'<path d="M770,820 v150" stroke="{TEAL}" stroke-width="5"/>'
        f'<g stroke="{MINT}" stroke-width="6" stroke-linecap="round"><path d="M685,860 h60M685,890 h60M685,920 h45M795,860 h60M795,890 h60M795,920 h45"/></g></g>')
arm = f'<path d="M520,1010 Q620,980 690,920" fill="none" stroke="{BLUE}" stroke-width="44" stroke-linecap="round"/>'
ART[4] = ground() + person(440, 1150, 1.05, body=BLUE, hair=NAVY, glasses=True) + arm + book
# 60+: grey hair + glasses, eye with check
check = (f'<circle cx="780" cy="760" r="120" fill="{GRAY}"/>' + eye(780, 760, 170, stroke=NAVY, sw=7)
         + f'<circle cx="862" cy="842" r="38" fill="{TEAL}"/><path d="M845,842 l12,12 l22,-24" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>')
ART[5] = ground() + person(420, 1150, 1.08, body=TEAL, grey=True, glasses=True) + check
# CTA: calendar with check
cal = (f'<rect x="360" y="700" width="360" height="330" rx="34" fill="{GRAY}"/>'
       f'<path d="M360,734 a34,34 0 0 1 34,-34 h292 a34,34 0 0 1 34,34 v56 h-360 z" fill="{TEAL}"/>'
       f'<g fill="{WHITE}"><rect x="440" y="672" width="22" height="62" rx="11"/><rect x="618" y="672" width="22" height="62" rx="11"/></g>'
       + "".join(f'<rect x="{400+i%4*76}" y="{830+i//4*66}" width="50" height="40" rx="10" fill="{MINT}"/>' for i in range(8) if i != 5)
       + f'<circle cx="{400+1*76+25}" cy="{830+66+20}" r="44" fill="{BLUE}"/>'
       + f'<path d="M{455},{916} l16,16 l30,-32" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
ART[6] = ground() + cal

# ---------- Copy ----------
SLIDES = [
    dict(cover=True, h="YOUR EYES AT<br>EVERY AGE", b="What to check, and when."),
    dict(tag="Ages 0–17", h="Kids &amp; teens.",
         pts=["Book a first eye exam before they start school.",
              "Watch for squinting, head tilting or sitting too close to screens."]),
    dict(tag="Ages 20–39", h="20s &amp; 30s.",
         pts=["An eye exam every 2 years.",
              "Manage screen strain with regular breaks from your screens.",
              "A stable prescription may make you a LASIK candidate. Your doctor will tell you."]),
    dict(tag="Ages 40–59", h="40s &amp; 50s.",
         pts=["Reading up close getting harder? That's presbyopia, and it's normal.",
              "Start regular eye pressure checks."]),
    dict(tag="Ages 60+", h="60+.",
         pts=["An eye exam every year.",
              "Screening for cataracts, glaucoma and changes in the macula."]),
    dict(cta=True, h="When was your last eye exam?",
         b="Book your check-up at LaserVision.",
         b2="Consult your eye doctor first. They'll know where to send you."),
]

CSS = f"""
@font-face{{font-family:Outfit;font-weight:300;src:url('{FONTS}/Outfit-Light.ttf')}}
@font-face{{font-family:Outfit;font-weight:500;src:url('{FONTS}/Outfit-Medium.ttf')}}
@font-face{{font-family:Outfit;font-weight:700;src:url('{FONTS}/Outfit-Bold.ttf')}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;overflow:hidden;font-family:Outfit;color:{WHITE};
  background:linear-gradient(180deg,{NAVY} 0%,#00425A 45%,{BLUE} 100%)}}
.slide{{position:relative;width:1080px;height:1350px;overflow:hidden}}
.dots-bg{{position:absolute;inset:0;background-image:radial-gradient(rgba(182,223,229,.13) 2.2px,transparent 2.6px);
  background-size:18px 18px;-webkit-mask-image:linear-gradient(115deg,#000 0%,transparent 45%)}}
.glow{{position:absolute;left:50%;top:930px;width:1100px;height:760px;transform:translate(-50%,-50%);
  background:radial-gradient(closest-side,rgba(48,164,191,.45),rgba(48,164,191,0))}}
.counter{{position:absolute;top:96px;right:96px;text-align:right;font-weight:300;font-size:26px;letter-spacing:.5px}}
.counter .d{{display:flex;gap:9px;margin-top:14px}}
.counter i{{width:26px;height:26px;border:2px solid {WHITE};border-radius:50%;display:block}}
.counter i.on{{background:{WHITE}}}
.txt{{position:absolute;left:108px;right:108px;top:190px}}
.tag{{display:inline-block;font-weight:500;font-size:26px;letter-spacing:2px;text-transform:uppercase;
  color:{NAVY};background:{MINT};padding:8px 20px;border-radius:40px;margin-bottom:26px}}
h1{{font-weight:700;font-size:104px;line-height:1.0;letter-spacing:-2.5px}}
h1.cover{{font-size:108px;line-height:.98;margin-top:40px}}
h1.cta{{font-size:92px}}
.sub{{font-weight:300;font-size:44px;margin-top:26px;letter-spacing:-.5px}}
ul{{list-style:none;margin-top:30px}}
li{{position:relative;padding-left:40px;font-weight:300;font-size:36px;line-height:1.28;margin-bottom:16px;letter-spacing:-.3px}}
li:before{{content:"";position:absolute;left:0;top:15px;width:16px;height:16px;border-radius:50%;background:{TEAL};box-shadow:0 0 0 4px rgba(48,164,191,.3)}}
p.b{{font-weight:500;font-size:42px;margin-top:28px;color:{MINT}}}
p.b2{{font-weight:300;font-size:36px;margin-top:18px;line-height:1.28}}
svg.art{{position:absolute;left:0;top:0;width:1080px;height:1350px}}
.fade{{position:absolute;left:0;right:0;bottom:0;height:260px;background:linear-gradient(0deg,rgba(0,48,63,.85),rgba(0,48,63,0))}}
.logo{{position:absolute;bottom:62px;left:50%;transform:translateX(-50%);height:66px}}
.foot{{position:absolute;left:72px;right:72px;bottom:62px;display:flex;align-items:center;justify-content:space-between;font-weight:300;font-size:25px}}
.foot img{{height:58px}} .foot .br span{{margin:0 14px}}
.foot .ph{{display:flex;align-items:center;gap:12px;font-weight:500;font-size:28px}} .wa{{width:32px;height:32px}}
"""

def logo_tag(cls="logo"):
    return f'<img class="{cls}" src="{LOGO}">'

for n, s in enumerate(SLIDES, 1):
    dots = "".join(f'<i class="{"on" if k == n else ""}"></i>' for k in range(1, TOTAL + 1))
    if s.get("cover"):
        txt = f'<h1 class="cover">{s["h"]}</h1><div class="sub">{s["b"]}</div>'
    elif s.get("cta"):
        txt = f'<h1 class="cta">{s["h"]}</h1><p class="b">{s["b"]}</p><p class="b2">{s["b2"]}</p>'
    else:
        txt = f'<span class="tag">{s["tag"]}</span><h1>{s["h"]}</h1><ul>{"".join(f"<li>{p}</li>" for p in s["pts"])}</ul>'
    footer = (f'<div class="foot">{logo_tag("")}<div class="br"><span>Hazmieh</span><span>Saida</span><span>Tripoli</span><span>Hôtel-Dieu</span></div>'
              f'<div class="ph">{WA}+961 81 54 20 20</div></div>') if s.get("cta") else logo_tag()
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="slide">
<div class="dots-bg"></div><div class="glow"></div>
<svg class="art" viewBox="0 0 1080 1350">{ART[n]}</svg><div class="fade"></div>
<div class="counter">{n:02d}/{TOTAL:02d}<div class="d">{dots}</div></div>
<div class="txt">{txt}</div>{footer}</div></body></html>"""
    (HERE / "html").mkdir(exist_ok=True)
    (HERE / "html" / f"slide-{n:02d}.html").write_text(html)
print("built", len(SLIDES))
