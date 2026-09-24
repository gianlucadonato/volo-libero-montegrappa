# Weather icons

Animated SVGs from [Makin-Things/weather-icons](https://github.com/Makin-Things/weather-icons),
MIT licensed, from the set's `animated/` directory. Only the files the forecast
tables actually render are vendored rather than the whole set.

The animation is CSS keyframes embedded in each SVG, so it plays inside a plain
`<img>` — the file does not need inlining into the bundle.

They are served from here rather than hotlinked from elmeteo.it: the source
publishes its own GIFs, but a page view must never send a request there. See
`lib/elmeteo-forecast-view.ts` for the elmeteo name -> file mapping.

| elmeteo | file |
| --- | --- |
| `sereno` | `clear-day.svg` |
| `poconuv` | `cloudy-1-day.svg` |
| `parznuv` | `cloudy-3-day.svg` |
| `coperto` | `cloudy.svg` |
| `copiog` | `rainy-2.svg` |
| `tempor` | `severe-thunderstorm.svg` |
| `nebbia` | `fog.svg` |

Two more are keyed off the risk column's note rather than off a source glyph —
elmeteo.it prints that warning as words, not as an icon:

| risk note | file | |
| --- | --- | --- |
| `...moderate wind...` | `dust.svg` | still, tan |
| `...strong wind...` | `wind.svg` | animated, blue |

Same artwork in both; the movement and the colour are what separate them, so the
animation is spent on the level a pilot has to act on. `dust` is the set's only
still file here — every other one animates.

Adding a mapping means vendoring its file here too.

## They carry no `viewBox`, and most of them do not fill their canvas

Each file declares a bare `width="56" height="48"`. With no `viewBox` the canvas
cannot be re-fitted by aspect, so a square box letterboxes the artwork — which is
why the table sizes the `img` 56x48 rather than to a square.

The artwork does not reach the bottom of that canvas either. Measured by
rasterising each file and reading its opaque bounds, at a rendered height of
48px:

| file | empty band below the artwork |
| --- | --- |
| `clear-day` | 21.0px |
| `rainy-2` | 14.6px |
| `fog` | 14.0px |
| `cloudy-1-day` | 13.9px |
| `cloudy-3-day` | 13.9px |
| `cloudy` | 13.9px |
| `dust` | 8.0px |
| `wind` | 8.0px |
| `severe-thunderstorm` | 1.3px |

The table closes that band with a negative bottom margin so the text sits under
the artwork rather than under the empty space. `severe-thunderstorm` is the
exception — its bolt reaches 97% of the height — and so are the two wind glyphs,
which are drawn lower on their canvas than the cloud ones. All three are exempted
in `lib/elmeteo-forecast-view.ts`. A newly vendored file needs the same measurement
before it is added to that set, or left out of it.
