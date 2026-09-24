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
| `severe-thunderstorm` | 1.3px |

The table closes that band with a negative bottom margin so the cloud figures sit
under the artwork rather than under the empty space. `severe-thunderstorm` is the
exception — its bolt reaches 97% of the height — so it is exempted in
`lib/elmeteo-forecast-view.ts`. A newly vendored file needs the same measurement
before it is added to that set, or left out of it.
