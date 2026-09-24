# Weather icons

Static SVGs from [Makin-Things/weather-icons](https://github.com/Makin-Things/weather-icons),
MIT licensed. Only the files the forecast tables actually render are vendored
rather than the whole set.

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
