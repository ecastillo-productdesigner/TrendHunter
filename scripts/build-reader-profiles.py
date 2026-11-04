"""Build the public, read-only fictional reader profiles from the personal-profile shell."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
readers = [
    {'id': 'alex-rivera', 'name': 'Alex Rivera', 'image': 'assets/readers/alex-rivera.png',
     'saved': ['trend-retailtainment.html', 'trend-run-club-connections.html'],
     'collections': ['collection-retailtainment-hubs.html', 'collection-fitness-reset.html'],
     'calls': {'retail-events': 'in', 'run-club-connections': 'in', 'sober-socials': 'out'}},
    {'id': 'jamie-park', 'name': 'Jamie Park', 'image': 'assets/readers/jamie-park.png',
     'saved': ['trend-skin-longevity.html', 'trend-somatic-sleep.html'],
     'collections': ['collection-evidence-based-beauty.html', 'collection-longevity.html'],
     'calls': {'skin-longevity': 'in', 'sleep-routines': 'in', 'protein-coffee': 'out'}},
    {'id': 'morgan-lee', 'name': 'Morgan Lee', 'image': 'assets/readers/morgan-lee.png',
     'saved': ['trend-home-energy.html', 'trend-everyday-protein.html'],
     'collections': ['collection-clean-living-control.html', 'collection-protein-forward-eating.html'],
     'calls': {'home-energy': 'in', 'dollar-stores': 'out', 'protein-coffee': 'in'}},
    {'id': 'taylor-brooks', 'name': 'Taylor Brooks', 'image': 'assets/readers/taylor-brooks.png', 'saved': [], 'collections': ['collection-evidence-based-beauty.html', 'collection-longevity.html'], 'calls': {'skin-longevity': 'in', 'sleep-routines': 'in', 'protein-coffee': 'out'}},
    {'id': 'quinn-ellis', 'name': 'Quinn Ellis', 'image': 'assets/readers/quinn-ellis.png', 'saved': [], 'collections': ['collection-evidence-based-beauty.html', 'collection-longevity.html'], 'calls': {'skin-longevity': 'in', 'sleep-routines': 'in', 'protein-coffee': 'out'}},
    {'id': 'casey-reed', 'name': 'Casey Reed', 'image': 'assets/readers/casey-reed.png', 'saved': [], 'collections': ['collection-evidence-based-beauty.html', 'collection-longevity.html'], 'calls': {'skin-longevity': 'in', 'sleep-routines': 'in', 'protein-coffee': 'out'}},
    {'id': 'riley-chen', 'name': 'Riley Chen', 'image': 'assets/readers/riley-chen.png', 'saved': [], 'collections': ['collection-evidence-based-beauty.html', 'collection-longevity.html'], 'calls': {'skin-longevity': 'in', 'sleep-routines': 'in', 'protein-coffee': 'out'}},
]
# User-supplied community photos receive fictional reader identities here. These are
# illustrative public libraries, not real people, saved items, votes or live readers.
catalog_source = (SITE / 'collection-data.js').read_text()
catalog = {c['href']: c for c in json.loads(re.search(r'Object.freeze\((\[.*?\])\.map', catalog_source, re.S)[1])}
template = (SITE / 'userprofile.html').read_text()

def story_row(href):
    source = (SITE / href).read_text()
    title = re.search(r'<title>(.*?)</title>', source, re.S)[1].replace(' — Trend Hunter', '').replace('Trend Hunter — ', '')
    title = html.unescape(title)
    # Match the story's existing bookmark metadata so public Saved uses its original image.
    image = re.search(r'data-image="([^"]+)"', source)[1]
    return f'<li class="story-lockup"><img class="story-lockup-image" src="{image}" alt=""><h2 class="story-lockup-headline profile-story-headline"><a class="story-lockup-link" href="{href}">{html.escape(title)}</a></h2></li>'

def collection_row(href):
    item = catalog[href]
    name = html.escape(item['name'])
    direction, value = item['direction'], item['percentage']
    return f'<li><a class="pill-button" href="{href}">{name} <span class="collection-momentum collection-momentum--{direction}" role="img" aria-label="Interest {direction} {value}%"><span class="collection-momentum-track" aria-hidden="true"><span class="collection-momentum-fill"></span></span><span class="collection-momentum-value" aria-hidden="true">{value}%</span></span></a></li>'

for reader in readers:
    page = template.replace('Trend Hunter — User Profile', f"Trend Hunter — {reader['name']}")
    # These community profiles require sign-in in this browser-only prototype.
    page = page.replace('</head>', """<script>
    try {
      if (sessionStorage.getItem('signed-in') !== 'true') {
        sessionStorage.setItem('return-to', location.pathname.split('/').pop() + location.hash);
        location.replace('login.html');
      }
    } catch { location.replace('login.html'); }
  </script>
</head>""")
    page = page.replace('class="page-profile"', 'class="page-profile page-reader"')
    page = page.replace('<main class="profile">', '<!-- Fictional public reader profile. All libraries and calls are illustrative and read-only. -->\n  <main class="profile" data-reader-calls="' + html.escape(json.dumps(reader['calls']), quote=True) + '">')
    page = page.replace('aria-label="Account"', 'aria-label="Reader profile"')
    page = page.replace(' aria-current="page"', '')
    page = page.replace('assets/profile/avatar-clementine.png', reader['image']).replace('Clementine', reader['name'])
    page = re.sub(r'    <!-- Profile Header -->', '    <!-- Public reader: no authored posts or owner controls -->', page)
    page = re.sub(r'      <button class="edit-profile-button".*?</button>\n', '', page)
    page = re.sub(r'    <section id="profile-saved".*?</section>', '<section id="profile-saved" class="profile-panel" role="tabpanel" aria-labelledby="profile-saved-tab" data-profile-panel="stories"><ul class="story-list reader-story-list">' + ''.join(story_row(href) for href in reader['saved']) + '</ul></section>', page, flags=re.S)
    page = re.sub(r'    <section id="profile-collections".*?</section>', '<section id="profile-collections" class="profile-panel" role="tabpanel" aria-labelledby="profile-collections-tab" data-profile-panel="collections" hidden><ul class="collection-list">' + ''.join(collection_row(href) for href in reader['collections']) + '</ul></section>', page, flags=re.S)
    page = re.sub(r'  <!-- Edit Profile modal.*?</dialog>\n', '', page, flags=re.S)
    page = re.sub(r'  <!-- Prototype settings.*?<script src="settings.js[^>]+></script>\n', '', page, flags=re.S)
    page = re.sub(r'  <script type="module" src="collections.js[^>]+></script>\n', '', page)
    page = re.sub(r'  <footer class="site-footer site-footer--page">.*?</footer>\n', '', page, flags=re.S)
    page = re.sub(r'<button\b[^>]*id="profile-saved-tab"[^>]*>.*?</button>\s*', '', page, flags=re.S)
    page = re.sub(r'<section id="profile-saved".*?</section>\s*', '', page, flags=re.S)
    page = re.sub(r'(<button id="profile-collections-tab"[^>]*class=")filter-tab("[^>]*aria-selected=")false', r'\1filter-tab filter-tab--active\2true', page)
    page = re.sub(r'(<section id="profile-collections"[^>]*?) hidden', r'\1', page)
    (SITE / f"reader-{reader['id']}.html").write_text(page)
print(f'Built {len(readers)} read-only reader profiles')
