"""Regression checks for the published Cannabis Basics article library."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
ROOT=Path(__file__).resolve().parents[2]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.links=[];self.images=[];self.cards=0;self.ids=set();self.headings=0;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);self.ids.add(a.get('id',''))
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='img':self.images.append(a.get('src',''))
  if tag=='article' and 'article-card' in a.get('class','').split():self.cards+=1
  if tag=='h1':self.headings+=1
expected=json.loads((ROOT/'.github/scripts/article-inventory.json').read_text())
assert len(expected)>=26 and len(set(expected))==len(expected),'Article inventory was reduced or duplicated'
home=(ROOT/'index.html').read_text();page=Page(home)
assert 'articles' in page.ids and 'articleGrid' in page.ids,'Article library containers missing'
assert page.cards>=len(expected),'Article cards must be present in HTML before JavaScript runs'
for name in expected:
 assert name in page.links, f'Missing native article link: {name}'
 p=ROOT/name
 assert p.is_file(),f'Missing article page: {name}'
 text=p.read_text();article=Page(text)
 assert article.headings>=1 and len(text)>2000,f'Empty article: {name}'
 for asset in ['reader-setup.js','read-aloud.js','reader-comfort.js']:
  assert asset in text,f'Missing reading toolbar asset {asset}: {name}'
 for href in article.links:
  u=urlsplit(href)
  if not u.scheme and u.path.endswith('.html'):
   target=(ROOT/u.path.lstrip('/')) if u.path.startswith('/') else (p.parent/unquote(u.path)).resolve()
   assert target.is_file(),f'Broken article navigation: {name} -> {href}'
for image in page.images:
 if image.startswith('assets/banners/'):assert (ROOT/image).is_file(),f'Missing article artwork: {image}'
section=home.split('<section id="articles"',1)[1].split('</section>',1)[0]
assert 'class="wrap fade-up"' not in section,'Article library must not depend on a scroll-reveal threshold'
assert 'id="cb-article-library-visible"' in home,'Article visibility safeguard missing'
print(f'Passed: {len(expected)} article pages, static library cards, reading toolbar assets, artwork and article navigation.')
