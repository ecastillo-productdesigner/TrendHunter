# TrendHunter prototype

- The editable website is in `site/`. It uses plain HTML, CSS and JavaScript.
- Use the existing Trend Hunter DS tokens in `site/feed.css` for component values. Barlow Condensed is the display font; Inter is the body font.
- Update the design-system reference when changing shared styles or behavior. Its generator is `scripts/build-design-guide.py`.
- The demo password gate is in `access/`. It is injected into every published HTML page by `npm run build`; `dist/` is generated and ignored by Git.
- Keep the prototype's sample voting data and fictional authors clearly identified in source and documentation.
- Run `npm run check` before publishing. Review the relevant mobile or desktop flow in the browser when changing behavior or layout.
- Pushes to `main` publish the built `dist/` folder through GitHub Pages.
