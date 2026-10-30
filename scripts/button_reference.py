"""Source-backed inventory of button markup, including styled anchor buttons."""
import html
import json
import re

ANCHOR_CLASSES = {'button-primary', 'pill-button', 'auth-button', 'nav-login', 'nav-predictions', 'drawer-link', 'answer-outline-button', 'prediction-card-more', 'nav-back', 'channel-button', 'trend-card-collection', 'share-sheet-email', 'avatar'}


def button_inventory(project):
    registry = {}
    files = sorted(list(project.glob('*.html')) + list(project.glob('*.js')))
    thumb = re.search(r"const thumb = '(.*?)';", (project / 'answer-page.js').read_text()).group(1)
    for source in files:
        text = source.read_text()
        for tag, attrs, body in re.findall(r'<(button|a)\b([^>]*)>(.*?)</\1>', text, re.S):
            match = re.search(r'\bclass=["\']([^"\']*)["\']', attrs)
            classes = match[1] if match else ''
            if tag == 'a' and not (set(classes.split()) & ANCHOR_CLASSES):
                continue
            key = f'{tag}:{classes}'
            if key not in registry:
                label = re.sub(r'<[^>]+>', '', body.replace('${thumb}', '')).strip()
                label = re.sub(r'\$\{.*?\}', '', label).replace("\\'", "'")
                aria = re.search(r'aria-label=["\']([^"\']*)["\']', attrs)
                name = html.unescape(label or (aria[1] if aria else classes or 'Unstyled filter button'))
                body = body.replace('${thumb}', thumb).replace("\\'", "'")
                body = re.sub(r'\$\{.*?\}', '', body)
                body = body.replace('src="assets/', 'src="../assets/')
                # Only presentation attributes survive; previews are inert and cannot sign in or vote.
                kept = ''.join(' '+m[0] for m in re.finditer(r'(?:aria-pressed|aria-expanded|aria-current|data-muted)="[^"]*"', attrs))
                markup = f'<{tag} class="{classes}"'+ (' type="button"' if tag=='button' else ' href="#"') + kept+'>'+body+f'</{tag}>'
                if classes=='bookmark-button': markup='<div class="article-actions">'+markup+'</div>'
                if classes in {'share-sheet-copy','share-sheet-email'}: markup='<div class="share-sheet-actions">'+markup+'</div>'
                registry[key] = {'key':key,'classes':classes,'tag':tag,'name':name,'markup':markup,'sources':[]}
            registry[key]['sources'].append(source.name)
    # These controls are created with document.createElement rather than template markup.
    generated = [
        ('prediction-share','Share prediction','<span class="trend-card-share-icon"></span>','share.js'),
        ('profile-prediction-filter','All','All','profile-predictions.js'),
        ('button-primary prediction-shortcut','Make your call','Make your call<span class="prediction-shortcut-icon material-symbols-outlined">arrow_downward</span>','predictions.js'),
    ]
    for classes, name, body, source in generated:
        key = 'button:'+classes
        if key not in registry:
            registry[key]={'key':key,'classes':classes,'tag':'button','name':name,'markup':f'<button type="button" class="{classes}">{body}</button>','sources':[source]}
    return sorted(registry.values(),key=lambda item:(item['classes'],item['tag']))


def build_button_reference(project, out):
    inventory = button_inventory(project)
    (out/'buttons.json').write_text(json.dumps({'buttons':[{k:v for k,v in item.items() if k!='markup'} for item in inventory]},indent=2)+'\n')
    cards=[]
    for item in inventory:
        name=html.escape(item['name']); classes=html.escape(item['classes'] or '(no class)')
        search=html.escape(' '.join([item['name'],item['classes'],*item['sources']]),quote=True)
        source=html.escape(item['sources'][0])
        cards.append(f'<article class="ds-button-entry" data-button-search="{search}"><h4>{name}</h4><div class="ds-button-canvas" aria-hidden="true" inert>{item["markup"]}</div><code>{classes}</code><p>{item["tag"]} · <a href="../{source}">{source}</a> · {len(set(item["sources"]))} source files</p></article>')
    states=[]
    def pair(name, default, active, active_label='Hover'):
        states.append(f'<article class="ds-button-state-family"><h4>{name}</h4><div class="ds-button-state-pair"><figure><div class="ds-button-canvas" aria-hidden="true" inert>{default}</div><figcaption>Default</figcaption></figure><figure><div class="ds-button-canvas" aria-hidden="true" inert>{active}</div><figcaption>{active_label}</figcaption></figure></div></article>')
    pair('Primary', '<button class="button-primary">Go deeper</button>','<button class="button-primary ds-hover-primary">Go deeper</button>')
    pair('Sign-in primary', '<button class="auth-button auth-button--primary">Continue</button>','<button class="auth-button auth-button--primary" disabled>Continue</button>','Disabled')
    for provider in ['Apple','Google']:
        icon='<span class="auth-apple-icon"></span>' if provider=='Apple' else '<span class="auth-button-icon"><img src="../assets/auth/icon-google.png" alt=""></span>'
        pair('Continue with '+provider,f'<button class="auth-button auth-button--provider">{icon}Continue with {provider}</button>',f'<button class="auth-button auth-button--provider ds-provider-hover">{icon}Continue with {provider}</button>')
    pair('Continue with Email','<span class="auth-button auth-button--email"><span class="auth-email-icon"></span>Continue with Email</span>','<span class="auth-button auth-button--email ds-email-hover"><span class="auth-email-icon"></span>Continue with Email</span>')
    pair('Collection pill','<span class="pill-button">Collection<span class="trend-icon trend-icon--up"></span></span>','<span class="pill-button ds-pill-hover">Collection<span class="trend-icon trend-icon--up"></span></span>')
    pair('Story collection label','<span class="trend-card-collection">Collection<span class="trend-icon trend-icon--up"></span></span>','<span class="trend-card-collection ds-collection-hover">Collection<span class="trend-icon trend-icon--up"></span></span>')
    shortcut='<span class="prediction-shortcut-icon material-symbols-outlined">arrow_downward</span>'
    pair('Make your call · sticky pill',f'<button class="button-primary prediction-shortcut ds-shortcut-example">Make your call{shortcut}</button>',f'<button class="button-primary prediction-shortcut ds-shortcut-example ds-shortcut-hover">Make your call{shortcut}</button>')
    pair('Make your call · comparison','<button class="button-primary profile-call-start">Make your call</button>','<button class="button-primary profile-call-start ds-call-start-hover">Make your call</button>')
    for direction in ['in','out']:
        pair('Vote · '+direction,f'<button class="prediction-vote prediction-vote--{direction}"><span class="prediction-vote-icon"></span>I’m {direction}</button>',f'<button class="prediction-vote prediction-vote--{direction} ds-vote-hover"><span class="prediction-vote-icon"></span>I’m {direction}</button>')
    pair('Prediction status filter','<button class="profile-prediction-filter" aria-pressed="false">All</button>','<button class="profile-prediction-filter" aria-pressed="true">All</button>','Active')
    pair('Section tab','<button class="filter-tab">Predictions</button>','<button class="filter-tab filter-tab--active">Predictions</button>','Active')
    pair('Share-menu action','<span class="share-menu-item"><span class="share-menu-icon share-menu-icon--email"></span>Email</span>','<span class="share-menu-item ds-share-icon-hover"><span class="share-menu-icon share-menu-icon--email"></span>Email</span>')
    return f'''<section id="buttons" class="ds-section"><div class="ds-section-heading"><p class="ds-eyebrow">Button reference</p><h2>Buttons and states</h2><p>All button markup variants found in the app source, including links styled as buttons and controls generated at runtime. Static previews cannot sign in, vote, share or change your account.</p></div><p class="ds-note">{len(inventory)} source variants. The state comparisons below show only states implemented in the product. Icon-only states are also documented in <a class="ds-text-link" href="#icons">Icons</a>.</p><div class="ds-button-state-families">{''.join(states)}</div><details class="ds-inventory" id="button-source-inventory"><summary>All source variants ({len(inventory)})</summary><label class="ds-icon-search">Find a button<input id="ds-button-search" type="search" placeholder="Try share, auth, vote, filter…"></label><div class="ds-button-inventory-grid">{''.join(cards)}</div><p id="ds-button-empty" hidden>No matching buttons.</p></details><p class="ds-note">The inventory is generated from site HTML and JavaScript. Hosting password-gate controls and controls belonging only to this design reference are outside the app inventory. <a class="ds-text-link" href="buttons.json" download>Download the button inventory</a>.</p></section>''',len(inventory)
