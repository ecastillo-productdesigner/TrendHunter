"""Build the complete source-asset inventory and product-state icon reference."""
from pathlib import Path
import html
import json
import re


def build_icon_reference(project, out):
    source_files = [p for p in project.rglob('*') if p.suffix in {'.html', '.css', '.js'} and 'design-system' not in p.parts]
    sources = {p.relative_to(project).as_posix(): p.read_text() for p in source_files}
    assets = sorted(p for p in (project / 'assets').rglob('*') if p.is_file() and (p.suffix == '.svg' or p.name.startswith('icon-') and p.suffix == '.png'))
    fonts = sorted(set(name for text in sources.values() for names in re.findall(r'icon_names=([^&"\s]+)', text) for name in names.split(',')))
    thumb = re.search(r"const thumb = '(.*?)';", sources['answer-page.js']).group(1)
    families = []

    def add(name, group, note, states):
        families.append({'name': name, 'group': group, 'note': note, 'states': states})

    def span(klass, text=''):
        return f'<span class="{klass}">{text}</span>'

    def image(path, klass=''):
        return f'<img class="{klass}" src="../assets/{path}" alt="">'

    def state(label, markup, surface=''):
        return {'label': label, 'markup': markup, 'surface': surface}

    add('Bookmark · story card', 'Navigation and saved', '32px. Inactive is outlined; active is filled lime. Photo-card icons stay light in both themes.', [
        state('Inactive · not saved', '<button class="bookmark-button" aria-pressed="false">'+span('bookmark-icon')+'</button>', 'photo'),
        state('Active · saved', '<button class="bookmark-button" aria-pressed="true">'+span('bookmark-icon')+'</button>', 'photo'),
        state('Story hover / focus · white', '<button class="bookmark-button ds-story-bookmark-hover" aria-pressed="false">'+span('bookmark-icon')+'</button>', 'photo')])
    add('Bookmark · article', 'Navigation and saved', '20px. Uses the article-specific outline, fill and light-theme rim.', [
        state(label, f'<div class="article-actions"><button class="bookmark-button" aria-pressed="{pressed}">'+span('bookmark-icon')+'</button></div>')
        for label, pressed in [('Inactive · not saved','false'), ('Active · saved','true')]])
    add('Bookmark · profile', 'Navigation and saved', '32px. The active profile bookmark includes its separate outline layer in light theme.', [
        state(label, f'<div class="profile-story-list"><button class="bookmark-button" aria-pressed="{pressed}">'+span('bookmark-icon')+'</button></div>')
        for label, pressed in [('Inactive · not saved','false'), ('Active · saved','true')]])
    add('Profile', 'Navigation and saved', '24px slot with a 16px glyph. Outline off-page; filled lime on the personal profile page.', [
        state('Inactive', '<span class="nav-profile">'+span('nav-profile-icon')+'</span>'),
        state('Active · current page', '<span class="nav-profile" aria-current="page">'+span('nav-profile-icon')+'</span>')])
    add('Daily Predictions shortcut', 'Navigation and saved', '24px Material Symbols Outlined bolt. FILL 0 inactive; FILL 1 and lime active. The navigation shortcut is mobile/tablet only.', [
        state('Inactive', '<span class="nav-predictions">'+span('nav-predictions-icon material-symbols-outlined','bolt')+'</span>'),
        state('Active · current page', '<span class="nav-predictions" aria-current="page">'+span('nav-predictions-icon material-symbols-outlined','bolt')+'</span>')])
    add('Menu', 'Navigation and saved', '20px. The menu glyph has dark and light theme assets; opening the drawer does not change its shape.', [
        state('Dark theme', image('feed/icon-menu.svg','nav-menu-icon'), 'dark'), state('Light theme', image('feed/icon-menu-light.svg','nav-menu-icon'), 'light')])
    add('Theme toggle', 'Navigation and saved', '24px. Sun switches to light theme; moon switches to dark theme.', [
        state('Dark · sun', image('feed/icon-theme.svg','nav-utility-icon'), 'dark'), state('Light · moon', image('feed/icon-theme-light.svg','nav-utility-icon'), 'light')])
    add('Back', 'Navigation and saved', '20px. Authentication navigation.', [state('Default', span('nav-back-icon'))])
    add('Custom share', 'Sharing', 'SVG: 20px-wide arrow in the 30px story-card slot, aligned with Bookmark’s visible edges. Default matches the unsaved bookmark; hover and keyboard focus turn white without a background. While the share menu is open, the icon is #BEFC4F. Prediction cards use a 24px slot at top right.', [state('Default · bookmark color', '<span class="story-share">'+span('trend-card-share-icon')+'</span>', 'photo'), state('Hover / keyboard focus · white', '<span class="story-share ds-story-share-hover">'+span('trend-card-share-icon')+'</span>', 'photo'), state('Active · menu open · #BEFC4F', '<span class="story-share" aria-expanded="true">'+span('trend-card-share-icon')+'</span>', 'photo')])
    add('Article and Answers share', 'Sharing', 'Article uses its 20px asset. Answers uses the 16px feed SVG.', [state('Article · 20px', span('article-share-icon')), state('Answers · 16px', span('answer-share-icon'))])
    for name, klass in [('Copy link','link'), ('Email','email'), ('More','more')]:
        add(name, 'Sharing', '20px share-menu icon. Hover changes the label and icon to white in dark mode; no hover background.', [
            state('Default', '<span class="share-menu-item">'+span('share-menu-icon share-menu-icon--'+klass)+'</span>'),
            state('Hover', '<span class="share-menu-item ds-share-icon-hover">'+span('share-menu-icon share-menu-icon--'+klass)+'</span>')])
    add('Volume', 'Media', '32px Material Symbols Outlined. Muted: FILL 0, bookmark gray. Sound on: FILL 1, #BEFC4F.', [
        state('Inactive · muted', '<span class="trend-card-sound" data-muted="true">'+span('trend-card-video-symbol','volume_off')+'</span>', 'photo'),
        state('Active · sound on', '<span class="trend-card-sound" data-muted="false">'+span('trend-card-video-symbol','volume_up')+'</span>', 'photo')])
    add('Play and pause feedback', 'Media', '48px, FILL 1, #BEFC4F. These are transient feedback icons after a tap, rather than permanent selected states.', [
        state('Play feedback', '<span class="trend-card-video-feedback">'+span('trend-card-video-symbol','play_circle')+'</span>', 'photo'),
        state('Pause feedback', '<span class="trend-card-video-feedback">'+span('trend-card-video-symbol','pause_circle')+'</span>', 'photo')])
    add('Checkbox', 'Authentication and settings', '20px. Unchecked outline and checked lime box use the actual separate box/check layers.', [
        state(label, '<label class="terms-acceptance"><input class="terms-checkbox" type="checkbox" '+checked+'>'+span('terms-checkbox-icon')+'</label>')
        for label, checked in [('Inactive · unchecked',''), ('Active · checked','checked')]])
    add('Prototype settings', 'Authentication and settings', '48px control with a 24px gear; open state uses Material Symbols Rounded cancel, FILL 0.', [
        state(label, f'<span class="settings-fab" aria-expanded="{expanded}">'+span('settings-fab-icon')+span('settings-fab-close material-symbols-rounded','cancel')+'</span>')
        for label, expanded in [('Inactive · closed','false'),('Active · open','true')]])
    add('Profile edit', 'Authentication and settings', 'Edit avatar badge.', [state('Default', span('edit-profile-avatar-icon'))])
    add('Apple and Google', 'Authentication and settings', 'Provider sign-in icons. The Apple mask follows the provider surface; Google retains its multicolor PNG. Both buttons hover to #E5E7EB.', [
        state('Apple', '<span class="ds-provider-icon">'+span('auth-apple-icon')+'</span>'),
        state('Google', '<span class="ds-provider-icon">'+image('auth/icon-google.png')+'</span>')])
    add('Close', 'Authentication and settings', 'The app uses a 24px drawer/toast cross, a 20px auth cross and a text × in the share dialog.', [state('Drawer · 24px', span('drawer-close-icon')), state('Auth · 20px', span('auth-close-icon')), state('Share dialog · ×', '<span class="share-sheet-close">×</span>')])
    for name, direction in [('In check','in'),('Out cross','out')]:
        add(name, 'Predictions and signals', 'The same glyph appears in the vote button, creator chip, resolved chip and background-free reader label. These are contexts, not invented toggle states.', [
            state('Vote button · 20px', f'<span class="prediction-vote prediction-vote--{direction}">'+span('prediction-vote-icon')+'</span>', 'dark'),
            state('Creator chip · 12px', f'<span class="prediction-badge prediction-badge--{direction}">'+span('prediction-badge-icon')+'</span>'),
            state('Resolved · 12px', f'<span class="prediction-badge prediction-badge--{direction} prediction-badge--resolved">'+span('prediction-badge-icon')+'</span>'),
            state('Reader comparison', f'<span class="prediction-result--comparison"><span class="prediction-badge prediction-badge--{direction} profile-reader-badge">'+span('prediction-badge-icon')+'</span></span>')])
    add('Trend arrows', 'Predictions and signals', 'Pills use the 12px up/down arrows. Collection mastheads use larger up/down arrows; the green up arrow has a light-theme outline layer. Directions are consistent per collection across the prototype.', [state('Up · pill',span('trend-icon trend-icon--up')),state('Down · pill',span('trend-icon trend-icon--down')),state('Up · masthead',span('sparkline-up')),state('Down · masthead',span('sparkline-down'))])
    add('Prediction context and time', 'Predictions and signals', '16px flip icon for Get context / Back to call. Clock has its own 13×16px box.', [state('Get context / back',span('prediction-card-link-icon'),'prediction'),state('Time',span('prediction-clock-icon'),'prediction')])
    add('Forward and jump', 'Predictions and signals', 'The same forward SVG supports Read more, submit and Make your call. The downward jump is Material Symbols Outlined, FILL 0.', [state('Read more',span('prediction-card-more-icon')),state('Submit', '<span class="answers-submit">'+span('answers-submit-icon')+'</span>'),state('Make your call','<span class="ds-forward-topic">'+span('prediction-card-more-icon')+'</span>'),state('Jump down',span('prediction-shortcut-icon material-symbols-outlined','arrow_downward'))])
    add('Answers sparkles', 'Predictions and signals', 'The Answers symbol is reused for prompts, questions and source labels.', [state('Default',span('answers-sparkle'))])
    add('Success checks', 'Predictions and signals', 'The complete-feed circle is 48px with a light-theme rim; toast check is 24px.', [state('Feed complete',span('feed-complete-icon')),state('Toast success',span('toast-icon'))])
    for label, down in [('Helpful answer',False),('Unhelpful answer',True)]:
        graphic = f'<span class="ds-thumb-down">{thumb}</span>' if down else thumb
        add(label, 'Answers feedback', '24px inline SVG. Active feedback changes its icon color and button surface; the thumb stays outlined.', [state('Inactive',f'<span class="answer-icon-button" aria-pressed="false">{graphic}</span>'),state('Active',f'<span class="answer-icon-button" aria-pressed="true">{graphic}</span>')])
    add('Text glyph controls', 'Answers feedback', 'These controls are text glyphs rather than icon files. Included so the reference covers all visible icon sources.', [state('Previous','<span class="answer-outline-button">←</span>'),state('Next','<span class="answer-outline-button">→</span>'),state('Citation','<span class="ds-text-glyph">↗</span>'),state('New thread','<span class="ds-text-glyph">+</span>')])

    # Show a shared glyph once; keep context differences in its usage note.
    def merge(names, name, note, choose):
        originals = [f for f in families if f['name'] in names]
        first = next(i for i,f in enumerate(families) if f['name'] in names)
        merged = {'name':name,'group':originals[0]['group'],'note':note,'states':choose(originals)}
        families[:] = [f for f in families if f['name'] not in names]
        families.insert(first,merged)

    merge(['Bookmark · story card','Bookmark · article','Bookmark · profile'], 'Bookmark',
          'Outlined when inactive; filled lime when saved. Story and profile: 32px. Article: 20px. Story hover and keyboard focus turn white, for both saved and unsaved states. The story glyph is 20px wide, aligned with Share. Article/profile follow the theme and use a separate outline layer in light mode.', lambda fs:fs[0]['states'])
    merge(['Custom share','Article and Answers share'], 'Share',
          'Crisp SVG on every card. Story slot: 30px with a 20px-wide arrow aligned to Bookmark; prediction: 24px at top right. Default matches the unsaved bookmark, including its light-theme color. Hover and keyboard focus turn white without a background; the open share menu keeps its icon #BEFC4F, including while hovered. Article: 20px; Answers: 16px. Opening the menu keeps the glyph; on prediction cards it flips with the card face.', lambda fs:fs[0]['states'])
    merge(['Copy link','Email','More'], 'Share-menu icons',
          '20px link, envelope and more icons. All menu items use the same hover: white label and icon in dark mode, with no background. After a successful copy, the link icon and Link Copied label stay lime for 5 seconds, with no toast.',
          lambda fs:[dict(f['states'][0],label=f['name']) for f in fs]+[dict(fs[1]['states'][1],label='Shared hover · Email'),state('Copied · 5 seconds','<span class="share-menu-item is-copied">'+span('share-menu-icon share-menu-icon--link')+'</span>')])
    merge(['In check','Out cross'], 'Prediction vote icons',
          'In uses a lime check; Out uses an orange-red cross. Vote buttons use 20px icons. Creator/reader badges use 12px: black on filled creator chips, state color in reader comparisons, gray when resolved. See comparison components for those contexts.',
          lambda fs:[dict(fs[0]['states'][0],label='In'),dict(fs[1]['states'][0],label='Out')])
    merge(['Helpful answer','Unhelpful answer'], 'Answer feedback',
          '24px outlined thumbs. Active feedback changes the icon color and button surface. Up and down share one SVG, rotated for the down state.',
          lambda fs:[dict(st,label=('Helpful' if i==0 else 'Unhelpful')+' · '+st['label']) for i,f in enumerate(fs) for st in f['states']])
    for family in families:
        if family['name']=='Menu':
            family['states']=[state('Default · follows theme',image('feed/icon-menu.svg','nav-menu-icon theme-dark-only')+image('feed/icon-menu-light.svg','nav-menu-icon theme-light-only'))]
        if family['name']=='Close':
            family['states']=[family['states'][0],family['states'][2]]
            family['note']='Shared close action. Drawer/toast: 24px. Authentication: 20px. Share dialog uses the text ×. Source variants remain listed in the asset inventory.'
        if family['name']=='Trend arrows':
            family['states']=family['states'][:2]
            family['note']='Green up and red down directions stay consistent per collection. Pills use 12px; mastheads use 24px up/down arrows. The up arrow has a supporting light-theme outline layer.'
        if family['name']=='Forward and jump':
            family['states']=[family['states'][0],family['states'][3]]
            family['note']='Forward is reused by Read more, submit and Make your call; its size/color come from the control. Jump down is the 16px outlined Material Symbol.'

    expected_fonts = {'arrow_downward','bolt','cancel','pause_circle','play_circle','volume_off','volume_up'}
    if set(fonts) != expected_fonts:
        raise ValueError(f'Update icon states for Material Symbols: {set(fonts) ^ expected_fonts}')
    manifest_assets = []
    for p in assets:
        relative = p.relative_to(project).as_posix()
        refs = [name for name, text in sources.items() if relative in text]
        manifest_assets.append({'path': relative, 'references': refs, 'used': bool(refs), 'brand': p.name.startswith(('wordmark','logo-'))})
    (out / 'icons.json').write_text(json.dumps({'assets': manifest_assets, 'materialSymbols': fonts, 'families': [{k:v for k,v in item.items() if k!='states'} | {'states':[s['label'] for s in item['states']]} for item in families]},indent=2)+'\n')

    cards = []
    for group in dict.fromkeys(f['group'] for f in families):
        items = []
        for family in (f for f in families if f['group']==group):
            samples = ''.join(f'<figure><div class="ds-icon-canvas {"ds-icon-canvas--"+s["surface"] if s["surface"] else ""}" aria-hidden="true" inert>{s["markup"]}</div><figcaption>{html.escape(s["label"])}</figcaption></figure>' for s in family['states'])
            search = html.escape(' '.join([family['name'], family['group'], family['note']]),quote=True)
            items.append(f'<article class="ds-icon-family" data-icon-search="{search}"><h4>{html.escape(family["name"])}</h4><div class="ds-icon-state-grid">{samples}</div><p>{html.escape(family["note"])}</p></article>')
        cards.append(f'<div class="ds-icon-group"><h3>{group}</h3><div class="ds-icon-family-grid">{"".join(items)}</div></div>')

    inventory = []
    for asset in manifest_assets:
        path = html.escape(asset['path'],quote=True)
        name = html.escape(asset['path'].replace('assets/',''))
        preview = image(asset['path'].removeprefix('assets/'),'ds-icon-brand') if asset['brand'] or asset['path'].endswith('icon-google.png') else f'<span class="ds-asset-mask" style="--ds-icon-asset:url(\'../{path}\')"></span>'
        usage = 'Brand mark' if asset['brand'] else 'Used in app' if asset['used'] else 'Retained asset · not currently used'
        if 'stroke' in asset['path'] or 'checkbox-check.svg' in asset['path']: usage += ' · supporting layer'
        preview_class = ' ds-asset-preview--light' if 'wordmark-light' in asset['path'] else ''
        inventory.append(f'<div class="ds-icon-asset" data-icon-search="{name}"><div class="ds-asset-preview{preview_class}" aria-hidden="true">{preview}</div><a href="../{path}"><code>{name}</code></a><p>{usage}</p></div>')
    count = sum(len(f['states']) for f in families)
    icon_count = sum(not a['brand'] for a in manifest_assets)
    markup = f'''<section id="icons" class="ds-section"><div class="ds-section-heading"><p class="ds-eyebrow">Icon reference</p><h2>Icons and states</h2><p>Every icon source in the app, including active and inactive states where they exist. Single-action icons keep their normal shape. The previews below reuse product classes and follow the theme switch.</p></div><p class="ds-note">{len(families)} icon families · {count} state previews · {icon_count} icon assets · {len(fonts)} Material Symbols · {len(manifest_assets)-icon_count} brand marks. The asset inventory is checked against the app source at build time.</p><label class="ds-icon-search">Find an icon<input id="ds-icon-search" type="search" placeholder="Try bookmark, active, volume, share…"></label><div id="ds-icon-families">{''.join(cards)}</div><p id="ds-icon-empty" hidden>No matching icons.</p><details class="ds-inventory" id="icon-assets"><summary>All source assets, including supporting layers and brand marks ({len(assets)})</summary><p class="ds-note">SVG and PNG files are listed individually. Supporting stroke/check layers are composed in the product previews above. The unused prediction-share asset is retained here for completeness; it is not presented as a live control.</p><div class="ds-icon-asset-grid">{''.join(inventory)}</div></details><p class="ds-note">Font sources: Material Symbols Outlined (arrow_downward, bolt, pause_circle, play_circle, volume_off, volume_up) and Rounded (cancel). Inline sources: Answers thumbs and the ×, ←, →, ↗ and + text controls. <a class="ds-text-link" href="icons.json" download>Download the icon inventory</a>.</p></section>'''
    return markup, len(families), count
