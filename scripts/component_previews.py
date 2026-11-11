"""Complete DS specimens built from the product's own templates and renderer."""
import html
import re
import subprocess


def relative_assets(markup):
    return re.sub(r'(href|src|poster)="(?!#|https?:|\.\./)([^"]+)"',
                  lambda match: f'{match[1]}="../{match[2]}"', markup)


def scoped(markup, prefix):
    ids = re.findall(r'\bid="([^"]+)"', markup)
    # Label/fragment references must stay with their isolated specimen.
    for identifier in sorted(set(ids), key=len, reverse=True):
        for attribute in ('id', 'for', 'aria-labelledby', 'aria-describedby'):
            markup = markup.replace(f'{attribute}="{identifier}"', f'{attribute}="{prefix}-{identifier}"')
        markup = markup.replace(f'href="#{identifier}"', f'href="#{prefix}-{identifier}"')
    return relative_assets(markup)


def build_dialog_previews(project):
    profile = re.search(r'<dialog class="edit-profile-modal".*?</dialog>',
                        (project / 'userprofile.html').read_text(), re.S).group()
    profile = scoped(profile, 'ds')
    profile = profile.replace('maxlength="40" required', 'maxlength="40" value="Clementine" required')
    # The app's photo button is a visual placeholder, not a photo editor.
    profile = profile.replace('aria-label="Change profile photo"',
                              'aria-label="Change profile photo (not implemented in prototype)" disabled')
    auth = re.search(r'<dialog class="auth-prompt".*?</dialog>',
                     (project / 'trend.html').read_text(), re.S).group()
    auth = scoped(auth, 'ds-legacy')
    auth = auth.replace('<dialog ', '<dialog id="ds-auth-prompt" ', 1)
    share = re.search(r'sheet.innerHTML = `(.+?)`;',
                      (project / 'share.js').read_text(), re.S).group(1)
    share = scoped(share, 'ds')
    share = share.replace('class="share-sheet-story"></p>',
                          'class="share-sheet-story">Skin longevity is reshaping beauty</p>')
    url = 'https://ecastillo-productdesigner.github.io/TrendHunter/trend.html'
    share = share.replace('type="url" readonly', f'type="url" value="{html.escape(url, quote=True)}" readonly')
    share = share.replace('class="share-sheet-email"', 'class="share-sheet-email" href="#ds-dialog-previews"')
    share = f'<dialog id="ds-share-fallback" class="share-sheet" aria-labelledby="ds-share-sheet-title">{share}</dialog>'
    examples = [
        ('Edit Profile', 'ds-edit-profile-modal', 'Edit the example name to enable Save. The preview updates its name locally and resets when reopened; it never changes your profile.'),
        ('Sign-in prompt · legacy', 'ds-auth-prompt', 'Retained authentication popup, with provider buttons, email action and policy footer. Current signed-out bookmark actions open the sign-in page instead. Authentication actions are presentation-only here.'),
        ('Share fallback', 'ds-share-fallback', 'The copyable-link dialog used when native sharing is unavailable. Copy link works on this example URL; Email is presentation-only. Closing restores focus to its preview button.'),
    ]
    cards = ''.join(f'<section class="ds-dialog-example"><h4>{name}</h4><p>{note}</p><button class="answer-outline-button" type="button" data-ds-dialog-open="{identifier}" aria-haspopup="dialog">Preview {name.split(" · ")[0]}</button></section>' for name, identifier, note in examples)
    return f'<article class="ds-panel ds-component" id="ds-dialog-previews"><h3>Complete dialog previews</h3><p>Open a complete dialog to inspect its layout, controls, keyboard focus and dismissal. These examples reuse the product markup and styles.</p><div class="ds-dialog-examples">{cards}</div><p class="ds-preview-status" data-ds-dialog-status role="status"></p>{profile}{auth}{share}</article>'


def build_answer_preview(project):
    response = subprocess.check_output([
        'node', '--input-type=module', '-e',
        "import { answerResponseMarkup } from './site/answer-markup.js'; process.stdout.write(answerResponseMarkup('What are new wellness trends?', 0));"
    ], cwd=project.parent, text=True)
    # Sharing the DS specimen must use its isolated dialog, not the user's system menu.
    response = response.replace('data-answer-share ', 'data-ds-answer-share ')
    response = scoped(response, 'ds-preview')
    form = re.search(r'<form class="answers-form answer-followup".*?</form>',
                     (project / 'answers.html').read_text(), re.S).group()
    return f'''<details class="ds-answer-example" open><summary>Complete response · interactive example</summary><p class="ds-note">Response, citations, feedback, source carousel, related questions and follow-up field. Questions and feedback stay inside this preview. All response copy and source attribution are fictional.</p><div class="ds-answer-viewport" tabindex="0" aria-label="Complete Answers preview. Scroll to explore."><div class="answer-page" data-ds-answer-preview><div data-ds-answer-thread>{response}</div><div class="answer-new-thread"><button class="answer-outline-button" type="button" data-ds-answer-reset>+ New thread</button><p>Trend Hunter Answers</p></div>{scoped(form, 'ds-preview')}<p class="answer-announcement visually-hidden" role="status"></p></div></div></details>'''
