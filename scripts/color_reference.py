"""Group unique theme colors while retaining every role in the token inventory."""
import html
import re

GROUPS = ['Brand', 'Neutrals', 'Signals', 'Topic colors']
PRIORITY = {'Brand': 0, 'Signals': 1, 'Topic colors': 2, 'Neutrals': 3}
ROLES = {
    '--color-black': 'Community member panel',
    '--color-accent-foreground': 'Accessible foreground accent',
    '--color-background-surface': 'Page surface', '--color-background-surface-raised': 'Raised surface',
    '--color-background-callout': 'Callouts', '--color-background-bg-overlay': 'Overlays',
    '--color-border-default': 'Borders', '--color-border-glass': 'Subtle borders', '--color-border-focus': 'Focus',
    '--color-border-on-topic': 'Topic borders', '--color-white-10': 'Subtle fills',
    '--color-text-primary': 'Primary text', '--color-text-body': 'Body text', '--color-text-secondary': 'Secondary text',
    '--color-text-dim': 'Dim text', '--color-text-tertiary': 'Utility text', '--color-text-accent': 'Accent text',
    '--color-text-on-topic': 'Topic text', '--color-text-body-link': 'Links', '--color-scrim': 'Scrims',
    '--color-icon-avatar': 'Avatars', '--color-icon-default': 'Icons', '--color-icon-signal': 'Signal icons',
    '--color-icon-signal-secondary': 'Secondary signals', '--color-interest-rising': 'Rising interest',
    '--color-interest-falling': 'Falling interest', '--color-icon-inverse': 'Inverse icons',
    '--color-icon-dim': 'Dim icons', '--color-text-inverse': 'Inverse text', '--color-recommendation': 'Recommendations',
    '--color-text-on-media': 'Text over video in both themes',
    '--color-icon-on-media': 'Icons over video in both themes',
    '--color-overlay-video': 'Video readability gradient',
    '--color-shadow-soft': 'Play/pause feedback shadow',
    '--color-shadow-strong': 'Volume control shadows',
}
NAMES = {'#BEFC4F': 'Lime', '#875FE7': 'Purple', '#FFFFFF': 'White', '#F5F7F9': 'Off white', '#E5E7EB': 'Cool gray 200',
         '#D1D5DB': 'Cool gray 300', '#9AA4B2': 'Cool gray 400', '#697182': 'Slate', '#343841': 'Charcoal',
         '#0F0F0F': 'Near black', '#000000': 'Black', '#EF4444': 'Red', '#FD4D13': 'Orange', '#FDE047': 'Yellow',
         '#A3FC03': 'Bright lime', '#669900': 'Leaf green'}


def resolve(name, values):
    value = values[name].strip()
    for _ in range(12):
        replacement = re.sub(r'var\((--[\w-]+)\)', lambda m: values.get(m[1], m[0]), value)
        if replacement == value:
            break
        value = replacement
    return value.strip()


def canonical(value):
    if re.fullmatch(r'#[0-9a-fA-F]{6}', value):
        return value.upper()
    match = re.fullmatch(r'rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)', value)
    if match:
        r, g, b = (int(float(v)) for v in match.groups()[:3])
        alpha = float(match[4] or 1)
        if alpha == 1:
            return f'#{r:02X}{g:02X}{b:02X}'
        return f'rgba({r}, {g}, {b}, {alpha:g})'
    return re.sub(r'\s+', ' ', value).strip()


def color_name(value, fallback):
    if value in NAMES:
        return NAMES[value]
    match = re.fullmatch(r'rgba\((255|0), \1, \1, ([\d.]+)\)', value)
    if match:
        return f'{"White" if match[1] == "255" else "Black"} at {float(match[2]) * 100:g}%'
    return fallback


def build_color_reference(base, light):
    themes = []
    for theme, values in [('dark', base), ('light', {**base, **light})]:
        rows = [('--buttons-primary-bg-default', 'Brand', 'Primary actions', 'Lime'),
                ('--color-background-callout', 'Brand', 'Callouts', 'Purple')]
        for name in base:
            if not name.startswith('--color-'):
                continue
            fallback = name.removeprefix('--color-').replace('-', ' ').capitalize()
            if name.startswith('--color-topic-'):
                topic = name.removeprefix('--color-topic-').replace('-', ' ').title()
                rows.append((name, 'Topic colors', f'{topic} topics', topic))
            else:
                signals = ('signal', 'interest', 'recommendation', 'text-accent', 'text-body-link', 'border-focus', 'accent-foreground')
                group = 'Signals' if any(part in name for part in signals) else 'Neutrals'
                rows.append((name, group, ROLES.get(name, fallback), fallback))
        unique = {}
        for token, group, role, fallback in rows:
            value = canonical(resolve(token, values))
            if value not in unique:
                unique[value] = {'group': group, 'name': color_name(value, fallback), 'roles': []}
            item = unique[value]
            if PRIORITY[group] < PRIORITY[item['group']]:
                item['group'] = group
            if role not in item['roles']:
                item['roles'].append(role)
        groups = []
        for group in GROUPS:
            entries = [(value, item) for value, item in unique.items() if item['group'] == group]
            cards = []
            for value, item in entries:
                safe_value = html.escape(value, quote=True)
                roles = html.escape(' · '.join(item['roles']))
                cards.append(f'<article class="ds-swatch" data-color-value="{safe_value}"><div class="ds-swatch-color" style="background:{safe_value}"></div><div><h4>{html.escape(item["name"])}</h4><code class="ds-swatch-value">{safe_value}</code><button class="ds-copy" data-copy-value="{safe_value}" aria-label="Copy color {safe_value}">Copy</button><p class="ds-color-uses"><strong>Uses:</strong> {roles}</p></div></article>')
            group_id = theme + '-' + group.lower().replace(' ', '-')
            groups.append(f'<section class="ds-color-group" aria-labelledby="{group_id}"><h3 id="{group_id}">{group} <span>{len(entries)}</span></h3><div class="ds-palette">{"".join(cards)}</div></section>')
        themes.append(f'<div class="ds-color-theme" data-palette-theme="{theme}"><p class="ds-color-count">{len(unique)} unique colors · shared uses grouped together</p>{"".join(groups)}</div>')
    return ''.join(themes)
