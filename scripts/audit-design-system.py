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
