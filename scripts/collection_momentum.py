"""Shared markup for illustrative collection-interest changes, not live analytics."""
from pathlib import PurePosixPath

# Stable prototype values: the same collection keeps its value on every page.
SAMPLE_INTEREST = {
    'collection-adventure-active-travel.html': 18,
    'collection-ai-everyday-life.html': 31,
    'collection-andropause-hormonal-midlife.html': 28,
    'collection-back-to-school-transitions.html': 20,
    'collection-beauty-from-within.html': 11,
    'collection-biohackers-body.html': 26,
    'collection-budgeted-living.html': 15,
    'collection-cardio-and-its-health.html': 7,
    'collection-clean-living-control.html': 12,
    'collection-everyday-living.html': 9,
    'collection-evidence-based-beauty.html': 22,
    'collection-fitness-reset.html': 19,
    'collection-food-as-an-experience.html': 24,
    'collection-gut-brain-axis.html': 13,
    'collection-health-technology.html': 32,
    'collection-her-health.html': 23,
    'collection-longevity.html': 17,
    'collection-lymphatic-system-literacy.html': 8,
    'collection-metabolic-life.html': 21,
    'collection-mind-body-for-families.html': 13,
    'collection-modern-anxiety-care.html': 16,
    'collection-modern-hydration-caffeine.html': 10,
    'collection-nervous-system-gym.html': 29,
    'collection-peptides.html': 9,
    'collection-preventive-health.html': 14,
    'collection-protein-forward-eating.html': 25,
    'collection-regulated-living.html': 8,
    'collection-retailtainment-hubs.html': 34,
    'collection-sleep-medicine.html': 27,
    'collection-smart-home-energy.html': 16,
    'collection-solo-travel.html': 7,
    'collection-supplement-science.html': 16,
    'collection-tactile-home-design.html': 9,
    'collection-the-intuitive-body.html': 6,
    'collection-wellness-maxxing.html': 13,
    'collection.html': 23,
    'channel.html': 18,
    'channel-everyday-living.html': 11,
    'channel-experiences.html': 24,
}


def momentum_markup(direction='rising', collection=None):
    # These sample changes are not measured data or percentage progress values.
    key = PurePosixPath(collection).name if collection else None
    value = SAMPLE_INTEREST.get(key, 22 if direction == 'rising' else 20)
    label = f'Interest {direction} {value}%'
    return (f'<span class="collection-momentum collection-momentum--{direction}" '
            f'data-level="{max(1, min(4, (value + 24) // 25))}" role="img" aria-label="{label}" title="{label}">'
            '<span class="collection-momentum-track" aria-hidden="true">'
            '<span class="collection-momentum-fill"></span></span>'
            f'<span class="collection-momentum-value" aria-hidden="true">{value}%</span></span>')
