"""Build the complete source-asset inventory and product-state icon reference."""
from pathlib import Path
import html
import json
import re
from collection_momentum import momentum_markup


def build_icon_reference(project, out):
    source_files = [p for p in project.rglob('*') if p.suffix in {'.html', '.css', '.js'} and 'design-system' not in p.parts]
    sources = {p.relative_to(project).as_posix(): p.read_text() for p in source_files}
    assets = sorted(p for p in (project / 'assets').rglob('*') if p.is_file() and (p.suffix == '.svg' or p.name.startswith('icon-') and p.suffix == '.png'))
    fonts = sorted(set(name for text in sources.values() for names in re.findall(r'icon_names=([^&"\s]+)', text) for name in names.split(',')))
    thumb = re.search(r"const thumb = '(.*?)';", sources['answer-markup.js']).group(1)
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
    add('Predict the Next Trend shortcut', 'Navigation and saved', '20px Material Symbols Outlined bolt in a 48px tap target. FILL 0 inactive; FILL 1 and lime active. The navigation shortcut is mobile/tablet only.', [
        state('Inactive', '<span class="nav-predictions">'+span('nav-predictions-icon material-symbols-outlined','bolt')+'</span>'),
        state('Active · current page', '<span class="nav-predictions" aria-current="page">'+span('nav-predictions-icon material-symbols-outlined','bolt')+'</span>')])
    add('Menu', 'Navigation and saved', '20px SVG mask using the DS icon color. Menu label and icon turn primary text color on hover or keyboard focus (white in dark mode); opening the drawer does not change the glyph.', [
        state('Dark theme', image('feed/icon-menu.svg','nav-menu-icon'), 'dark'), state('Light theme', image('feed/icon-menu-light.svg','nav-menu-icon'), 'light')])
    add('Theme toggle', 'Navigation and saved', '24px SVG mask. Sun switches to light theme; moon switches to dark theme. The glyph turns primary text color on hover or keyboard focus, matching Menu and Login.', [
        state('Dark · sun', image('feed/icon-theme.svg','nav-utility-icon'), 'dark'), state('Light · moon', image('feed/icon-theme-light.svg','nav-utility-icon'), 'light')])
    add('Custom share', 'Sharing', 'Outlined by default with the bookmark stroke weight; filled #BEFC4F while pressed or sharing is open. Experimental feed: 20px visible height in a 48px action target; videos are 10% smaller. Portrait cards retain the 20px-wide arrow in a 30px slot. Prediction slot: 24px. Focus adds a 2px ring with a 4px offset. No background or size change.', [
        state('Default · outlined', '<span class="story-share">'+span('trend-card-share-icon')+'</span>', 'photo'),
        state('Hover · outlined white', '<span class="story-share ds-share-hover">'+span('trend-card-share-icon')+'</span>', 'photo'),
        state('Pressed · filled #BEFC4F', '<span class="story-share ds-share-pressed">'+span('trend-card-share-icon')+'</span>', 'photo'),
        state('Sharing open · filled #BEFC4F', '<span class="story-share" aria-expanded="true">'+span('trend-card-share-icon')+'</span>', 'photo'),
        state('Keyboard focus · 2px ring / 4px offset', '<span class="story-share ds-share-focus">'+span('trend-card-share-icon')+'</span>', 'photo')])
    add('Article and Answers share', 'Sharing', 'The same outlined default and filled green open state. Article keeps its 20px slot; Answers keeps its 16px slot.', [state('Article · 20px', span('article-share-icon')), state('Answers · 16px', span('answer-share-icon'))])
    for name, klass in [('Copy link','link'), ('Email','email'), ('More','more')]:
        add(name, 'Sharing', '20px share-menu icon. Hover changes the label and icon to white in dark mode; no hover background.', [
            state('Default', '<span class="share-menu-item">'+span('share-menu-icon share-menu-icon--'+klass)+'</span>'),
            state('Hover', '<span class="share-menu-item ds-share-icon-hover">'+span('share-menu-icon share-menu-icon--'+klass)+'</span>')])
    add('Volume', 'Media', '32px Material Symbols Outlined in general media controls; Trending Videos and article players use 24px symbols in 48px targets. Article volume symbols sit 24px above the bottom and 12px from the right. Muted: FILL 0, bookmark gray. Sound on: FILL 1, #BEFC4F.', [
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
    add('Close', 'Authentication and settings', 'Shared 24px close icon for drawers, toasts and the Share dialog. Authentication retains its 20px variant. Source variants remain listed in the asset inventory.', [state('Shared · 24px', span('drawer-close-icon'))])
    for name, direction in [('In check','in'),('Out cross','out')]:
        add(name, 'Predictions and signals', 'The same glyph appears in the vote button, creator chip, resolved chip and background-free reader label. These are contexts, not invented toggle states.', [
            state('Vote button · 20px', f'<span class="prediction-vote prediction-vote--{direction}">'+span('prediction-vote-icon')+'</span>', 'dark'),
            state('Creator chip · 12px', f'<span class="prediction-badge prediction-badge--{direction}">'+span('prediction-badge-icon')+'</span>'),
            state('Resolved · 12px', f'<span class="prediction-badge prediction-badge--{direction} prediction-badge--resolved">'+span('prediction-badge-icon')+'</span>'),
            state('Reader comparison', f'<span class="prediction-result--comparison"><span class="prediction-badge prediction-badge--{direction} profile-reader-badge">'+span('prediction-badge-icon')+'</span></span>')])
    add('Verified prediction outcome', 'Predictions and signals', '20px Material Symbols Outlined fact_check, weight 400 and FILL 0. Lime for In and red for Out. Shared by the result popup and resolved profile comparison.', [state('In', '<span class="prediction-outcome-call"><strong data-outcome="in"><span class="prediction-outcome-verified material-symbols-outlined" aria-hidden="true">fact_check</span>In</strong></span>'), state('Out', '<span class="prediction-outcome-call"><strong data-outcome="out"><span class="prediction-outcome-verified material-symbols-outlined" aria-hidden="true">fact_check</span>Out</strong></span>')])
    add('Collection interest', 'Predictions and signals', 'Logo-inspired four-chevron indicator in a 20 × 14px box. Rising points right in DS lime; falling points left in DS red, with progressively fading chevrons. Percentages stay in accessible labels and tooltips, and keep the existing Trending sorting; they are hidden visually. Values are illustrative prototype data, not live analytics. Channel mastheads have no chevrons. Collection labels retain these chevrons; Caught on the Move places them after its time text alongside separate movement arrows.', [state('Interest rising · sample 22%', momentum_markup()), state('Interest falling · sample 20%', momentum_markup('falling'))])
    add('Directional arrow', 'Navigation and saved', 'One Google Material Symbols Outlined arrow_forward SVG: weight 400, FILL 0, grade 0, optical size 24. All directions rotate assets/feed/icon-arrow.svg. Read more, Submit and Jump down use 16px; Back, prediction Previous/Next and movement indicators use 20px; compact comparison actions use 12px. Digest and citation arrows scale with their labels. Sizes, theme colors, hover states, tap targets and destinations remain owned by each control. Share, trend chevrons and the context flip retain their dedicated shapes.', [state(label, span('icon-arrow'+modifier)) for label, modifier in [('Right · Read more / Next',''),('Left · Back / Previous',' icon-arrow--left'),('Down · Jump / expand',' icon-arrow--down'),('Up · Close digest',' icon-arrow--up'),('Diagonal · external / citation',' icon-arrow--external')]])
    add('Prediction context and time', 'Predictions and signals', '16px flip icon for Get context / Back to call. Clock has its own 13×16px box.', [state('Get context / back',span('prediction-card-link-icon'),'prediction'),state('Time',span('prediction-clock-icon'),'prediction')])
    add('Answers sparkles', 'Predictions and signals', 'The Answers symbol is reused for prompts, questions and source labels.', [state('Default',span('answers-sparkle'))])
    add('Success checks', 'Predictions and signals', 'Separate SVG exports of the same filled Google Material Symbols Rounded check_circle glyph. Feed complete uses a 48px box with a light-theme rim; Toast success uses a 24px box with a more inset drawing.', [state('Feed complete',span('feed-complete-icon')),state('Toast success',span('toast-icon'))])
    for label, down in [('Helpful answer',False),('Unhelpful answer',True)]:
        graphic = f'<span class="ds-thumb-down">{thumb}</span>' if down else thumb
        add(label, 'Answers feedback', '24px inline SVG. Active feedback changes its icon color and button surface; the thumb stays outlined.', [state('Inactive',f'<span class="answer-icon-button" aria-pressed="false">{graphic}</span>'),state('Active',f'<span class="answer-icon-button" aria-pressed="true">{graphic}</span>')])
    add('New thread', 'Answers feedback', 'The New thread plus is a text glyph. Directional controls use the shared arrow SVG.', [state('New thread','<span class="ds-text-glyph">+</span>')])

    add('Topic interests', 'Navigation and saved', '20px filled Material Symbols. Unselected icons inherit the neutral tile label; selected icons use dark text on the supplied topic fill, with white on the deep purple Tech tile.', [state('Health & Wellness', span('topic-icon','spa')),state('Beauty & Skincare', span('topic-icon','health_and_beauty')),state('Food & Drink', span('topic-icon','local_bar')),state('Fitness', span('topic-icon','directions_bike')),state('Home & Living', span('topic-icon','home')),state('Tech & AI', span('topic-icon','head_mounted_device')),state('Family & Parenting', span('topic-icon','family_restroom')),state('Culture & Experiences', span('topic-icon','public')),state('Travel', span('topic-icon','flight'))])

    add('Recommendation feedback', 'Recommendations', 'On feed cards, Recommended for you is the label beside these same controls: thumb_up means More like this; thumb_down means Not interested. The label uses --type-editorial-h4. Both icons are 20px Material Symbols Outlined in 48px targets and inherit the label color; selected thumbs are filled, and clicking again clears the choice. Feedback saves in place and applies on future For You visits. Reset Recommendations clears it. Article feedback reuses these icons beside What did you think about this trend?, before the members-exploring strip, with optional reasons in a modal.', [state('Feed card label and feedback controls', '<div class="trend-card-recommendation"><span>Recommended for you</span><span class="recommendation-inline-actions"><button class="recommendation-feedback-button" type="button" aria-label="More like this" aria-pressed="false">'+span('material-symbols-outlined','thumb_up')+'</button><button class="recommendation-feedback-button" type="button" aria-label="Not interested" aria-pressed="false">'+span('material-symbols-outlined','thumb_down')+'</button></span></div>', 'recommendation')])
    add('Member achievement medals', 'Predictions and signals', 'Logo-inspired medals in DS accent colors. The Sharp Eye eye_tracking symbol denotes verified prediction outcomes; it stays locked until verified records exist.', [state('Sharp Eye design', '<span class="badge-medal" data-badge="sharp-eye">'+span('material-symbols-outlined','eye_tracking')+'</span>')])

    # Show a shared glyph once; keep context differences in its usage note.
    def merge(names, name, note, choose):
        originals = [f for f in families if f['name'] in names]
        first = next(i for i,f in enumerate(families) if f['name'] in names)
        merged = {'name':name,'group':originals[0]['group'],'note':note,'states':choose(originals)}
        families[:] = [f for f in families if f['name'] not in names]
        families.insert(first,merged)

    merge(['Bookmark · story card','Bookmark · article','Bookmark · profile'], 'Bookmark',
          'Outlined when inactive; filled lime when saved. Experimental feed: 20px graphic in a 48px target, with a 32px gap between action targets (--spacing-layout-xl) and between the inward-aligned visible artwork. Portrait story and profile: 32px. Article: 20px. Story hover and keyboard focus turn white, for both saved and unsaved states. The story glyph is 20px wide, aligned with Share. Article/profile follow the theme and use a separate outline layer in light mode.', lambda fs:fs[0]['states'])
    merge(['Custom share','Article and Answers share'], 'Share',
          'Crisp SVG on every card. Experimental feed: 20px visible height, approximately 25.5px wide to preserve the original share shape, in a 48px target with a 32px action gap (--spacing-layout-xl), matching Bookmark; inward-aligned artwork also keeps a 32px visible gap and the bookmark’s 24px right inset; author portraits remain 24px. Portrait story slot: 30px with a 20px-wide arrow aligned to Bookmark; prediction: 24px at top right. Default is outlined and matches the unsaved bookmark stroke and color. Hover and keyboard focus turn white on photo cards and in dark mode, and dark on light page surfaces, with no background. Press fills the arrow and turns it #BEFC4F immediately; it stays filled lime while sharing is open. Focus adds a 2px ring with a 4px offset: lime on dark/photo/prediction cards, accessible green on light page surfaces. Size and position stay fixed. Article: 20px; Answers: 16px. Share opens the device system menu, with a Copy link/Email dialog when native sharing is unavailable. Closing sharing restores the outlined arrow; on prediction cards it flips with the card face.', lambda fs:fs[0]['states'])
    merge(['Copy link','Email','More'], 'Share-menu icons',
          'Saved custom menu: 20px link, envelope and more icons. All menu items use the same hover: white label and icon in dark mode, with no background. After a successful copy, the link icon and Link Copied label stay lime for 5 seconds, with no toast.',
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
        if family['name']=='Trend arrows':
            family['states']=family['states'][:2]
            family['note']='Green up and red down directions stay consistent per collection. Pills use 12px; mastheads use 24px up/down arrows. The up arrow has a supporting light-theme outline layer.'

    for badge_name, symbol in [('Regular Hunter','my_location'),('Deep Diver','scuba_diving'),('Field Notes','menu_book'),('Sharp Eye','eye_tracking')]:
        add(badge_name + ' badge', 'Predictions and signals', 'The selected Material Symbols Outlined achievement icon.', [state('Badge symbol', span('material-symbols-outlined',symbol))])
    add('Article comments', 'Community', '20px Material Symbols Outlined chat icon beside the collapsed Comments heading.', [state('Comments', span('material-symbols-outlined comments-chat-icon','chat'))])
    add('Comment heart', 'Community', 'Supplied heart at --spacing-layout-md (16px). Unselected outline and count match Reply and Report. Selected heart is filled and uses the primary text color.', [state('Unselected', '<span class="comment-like" aria-pressed="false">'+span('comment-heart-icon')+'</span>'), state('Selected', '<span class="comment-like" aria-pressed="true">'+span('comment-heart-icon')+'</span>')])
    expected_fonts = {'fact_check', 'family_restroom', 'home', 'chat','scuba_diving','my_location','eye_tracking','visibility','bolt','cancel','pause_circle','play_circle','volume_off','volume_up','health_and_beauty','menu_book','local_bar','spa','checkroom','head_mounted_device','directions_bike','public','flight','wand_stars','info','thumb_up','thumb_down'}
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
    archive = []
    for asset in manifest_assets:
        path = html.escape(asset['path'],quote=True)
        name = html.escape(asset['path'].replace('assets/',''))
        preview = image(asset['path'].removeprefix('assets/'),'ds-icon-brand') if asset['brand'] or asset['path'].endswith('icon-google.png') else f'<span class="ds-asset-mask" style="--ds-icon-asset:url(\'../{path}\')"></span>'
        usage = 'Brand mark' if asset['brand'] else 'Used in app' if asset['used'] else 'Archived · no app references'
        if 'stroke' in asset['path'] or 'checkbox-check.svg' in asset['path']: usage += ' · supporting layer'
        preview_class = ' ds-asset-preview--light' if 'wordmark-light' in asset['path'] else ''
        (inventory if asset['used'] else archive).append(f'<div class="ds-icon-asset" data-icon-search="{name}"><div class="ds-asset-preview{preview_class}" aria-hidden="true">{preview}</div><a href="../{path}"><code>{name}</code></a><p>{usage}</p></div>')
    count = sum(len(f['states']) for f in families)
    icon_count = sum(not a['brand'] for a in manifest_assets)
    markup = f'''<section id="icons" class="ds-section"><div class="ds-section-heading"><p class="ds-eyebrow">Icon reference</p><h2>Icons and states</h2><p>Every icon source in the app, including active and inactive states where they exist. Single-action icons keep their normal shape. The previews below reuse product classes and follow the theme switch.</p></div><p class="ds-note">{len(families)} icon families · {count} state previews · {icon_count} icon assets · {len(fonts)} Material Symbols · {len(manifest_assets)-icon_count} brand marks. The asset inventory is checked against the app source at build time.</p><label class="ds-icon-search">Find an icon<input id="ds-icon-search" type="search" placeholder="Try bookmark, active, volume, share…"></label><div id="ds-icon-families">{''.join(cards)}</div><p id="ds-icon-empty" hidden>No matching icons.</p><details class="ds-inventory" id="icon-assets" data-ds-icon-inventory><summary>Current source assets, including supporting layers and brand marks ({len(inventory)})</summary><p class="ds-note">SVG and PNG files referenced by the app. Supporting stroke/check layers are composed in the product previews above.</p><div class="ds-icon-asset-grid">{''.join(inventory)}</div></details><details class="ds-inventory" id="icon-archive" data-ds-icon-inventory><summary>Archived icons · not used in the app ({len(archive)})</summary><p class="ds-note">Legacy sources with no current app references. Kept for historical reference and excluded from the current asset list. The complete JSON inventory retains their usage status.</p><div class="ds-icon-asset-grid">{''.join(archive)}</div></details><p class="ds-note">Font sources: Material Symbols Outlined (navigation, media and the nine topic icons) and Rounded (cancel). Shared directional source: <a class="ds-text-link" href="../assets/feed/icon-arrow.svg">Google arrow_forward SVG</a> (Outlined, weight 400), rotated for direction. Inline sources: Answers thumbs and the + text control. <a class="ds-text-link" href="icons.json" download>Download the icon inventory</a>.</p></section>'''
    return markup, len(families), count
