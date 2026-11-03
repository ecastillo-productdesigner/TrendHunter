"""Shared markup for illustrative collection-interest changes, not live analytics."""


def momentum_markup(direction='rising'):
    # Reference examples are sample changes, not measured data or progress values.
    value = 22 if direction == 'rising' else 20
    label = f'Interest {direction} {value}%'
    return (f'<span class="collection-momentum collection-momentum--{direction}" '
            f'role="img" aria-label="{label}" title="{label}">'
            '<span class="collection-momentum-track" aria-hidden="true">'
            '<span class="collection-momentum-fill"></span></span>'
            f'<span class="collection-momentum-value" aria-hidden="true">{value}%</span></span>')
