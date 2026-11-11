"""Fail publication when the generated inventories no longer cover app sources."""
from pathlib import Path
import json
import re
from button_reference import button_inventory

project = Path(__file__).resolve().parents[1] / 'site'
guide = project / 'design-system'
icons = json.loads((guide / 'icons.json').read_text())
actual_assets = {p.relative_to(project).as_posix() for p in (project / 'assets').rglob('*') if p.is_file() and (p.suffix == '.svg' or p.name.startswith('icon-') and p.suffix == '.png')}
listed_assets = {a['path'] for a in icons['assets']}
assert actual_assets == listed_assets, f'Stale icon assets: {actual_assets ^ listed_assets}. Rebuild the DS.'
symbols = set()
for p in project.glob('*.html'):
    for names in re.findall(r'icon_names=([^&"\s]+)', p.read_text()):
        symbols.update(names.split(','))
assert symbols == set(icons['materialSymbols']), 'Stale Material Symbols inventory. Rebuild the DS.'
buttons = json.loads((guide / 'buttons.json').read_text())['buttons']
assert {b['key'] for b in buttons} == {b['key'] for b in button_inventory(project)}, 'Stale button inventory. Rebuild the DS.'
button_keys = {b['key'] for b in buttons}
for source in project.glob('*.js'):
    text = source.read_text()
    for variable in re.findall(r"(?:const|let)\s+(\w+)\s*=\s*document\.createElement\(['\"]button['\"]\)", text):
        for classes in re.findall(r'\b'+re.escape(variable)+r'\.className\s*=\s*[\'\"]([^\'\"]+)', text):
            assert 'button:'+classes in button_keys, f'Undocumented runtime button {classes} in {source.name}'
rails = 0
for p in project.glob('*.html'):
    for rail in re.findall(r'<div class="trend-card-actions">(.*?)</div>', p.read_text(), re.S):
        assert 'data-story-share' in rail or 'data-video-share' in rail, f'Missing story share in {p.name}'
        rails += 1
print(f'DS coverage passed: {len(actual_assets)} assets, {len(symbols)} Material Symbols, {len(buttons)} button variants; Share on {rails} story cards')

# Keep the rendered reference aligned with its source roles and full components.
from html.parser import HTMLParser
from datetime import date

class Reference(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.duplicates = set()
        self.references = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identifier = attrs.get('id')
        if identifier:
            if identifier in self.ids: self.duplicates.add(identifier)
            self.ids.add(identifier)
        for name in ('aria-labelledby', 'for'):
            self.references.extend(attrs.get(name, '').split())

page = (guide / 'index.html').read_text()
reference = Reference()
reference.feed(page)
assert not {identifier for identifier in reference.duplicates if identifier.startswith('ds-')}, 'Duplicate DS specimen IDs'
assert all(identifier in reference.ids for identifier in reference.references if identifier.startswith('ds-')), 'Broken preview labels'
typography = page.split('<section id="typography"', 1)[1].split('<section id="shape"', 1)[0]
for group in [('--type-section-heading', '--type-mobile-prediction-heading'), ('--type-helper', '--type-utility-helper'), ('--type-editorial-body', '--type-utility')]:
    rows = re.findall(r'<div class="ds-type-row">(.*?)(?=<div class="ds-type-row">|</div>\s*<h3 class="ds-type-group-heading">)', typography, re.S)
    assert any(all(f'data-copy="{token}"' in row for token in group) for row in rows), f'Ungrouped typography roles: {group}'
    for token in group:
        assert typography.count(f'data-copy="{token}"') == 1, f'Duplicate/missing typography specimen: {token}'
archive = page.split('id="icon-archive"', 1)[1].split('</details>', 1)[0]
current = page.split('id="icon-assets"', 1)[1].split('</details>', 1)[0]
for asset in icons['assets']:
    destination, other = (current, archive) if asset['used'] else (archive, current)
    assert f'href="../{asset["path"]}"' in destination and f'href="../{asset["path"]}"' not in other, f'Wrong asset inventory: {asset["path"]}'
for family in icons['families']:
    if family['name'] in {'Bookmark', 'Share'}:
        assert '16px action gap' not in family['note'] and '16px gap between action targets' not in family['note'], 'Stale action spacing note'
medal = page.split('<h4>Member achievement medals</h4>', 1)[1].split('</article>', 1)[0]
assert '>eye_tracking</span>' in medal and '>visibility</span>' not in medal, 'Sharp Eye does not match the badge catalog'
metadata_date = date.fromisoformat(json.loads((guide / 'tokens.json').read_text())['updated'])
assert f'Reference generated {metadata_date:%B} {metadata_date.day}, {metadata_date.year}' in page, 'Mismatched guide dates'
for identifier in ['ds-edit-profile-modal', 'ds-auth-prompt', 'ds-share-fallback', 'ds-preview-answer-0', 'ds-preview-answer-sources-0', 'ds-preview-answer-followup-input']:
    assert identifier in reference.ids, f'Missing complete component: {identifier}'
for klass, identifier in [('edit-profile-modal', 'ds-edit-profile-modal'), ('auth-prompt', 'ds-auth-prompt'), ('share-sheet', 'ds-share-fallback')]:
    assert re.search(r'<dialog\b(?=[^>]*\bclass="'+klass+r'")(?=[^>]*\bid="'+identifier+r'")[^>]*>', page), f'Preview lost product styling: {identifier}'
assert '__ANSWER_PREVIEW__' not in page and '__GENERATED_DATE__' not in page, 'Unresolved reference placeholder'
print('DS consistency passed: grouped typography, archive, dialog labels, complete Answers layout, spacing, Sharp Eye and generated dates')
