# Third-party license notes

The lockfile is the authoritative dependency/version inventory. This note identifies the four
non-default SPDX values called out during PR #4 review; they are package metadata, not missing or
unknown licenses.

| Package | Locked version | Scope | SPDX license | Upstream source |
|---|---:|---|---|---|
| `@csstools/color-helpers` | 6.1.0 | development transitive | `MIT-0` | [csstools/postcss-plugins](https://github.com/csstools/postcss-plugins) |
| `@csstools/css-syntax-patches-for-csstree` | 1.1.6 | development transitive | `MIT-0` | [csstools/postcss-plugins](https://github.com/csstools/postcss-plugins) |
| `lru-cache` (nested under `jsdom`) | 11.5.1 | development transitive | `BlueOak-1.0.0` | [isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache) |
| `postal-mime` | 2.7.4 | Resend transitive | `MIT-0` | [postalsys/postal-mime](https://github.com/postalsys/postal-mime) |

`MIT-0` is the SPDX identifier for the MIT No Attribution license. `BlueOak-1.0.0` is the SPDX
identifier for the Blue Oak Model License 1.0.0. Both identifiers are intentionally emitted by the
upstream packages and recognized by npm tooling. Complete license files ship with the installed
packages; dependency upgrades must preserve or refresh this table when a package, version, or
license changes.
