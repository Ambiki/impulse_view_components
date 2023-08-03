# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Set `initialClickTarget` to `null` when element gets destroyed

## [0.1.3] - 2023-08-03

### Added

- Pass HTML attributes to select choices ([#6](https://github.com/Ambiki/impulse_view_components/pull/6))
- Ability to hide the autocomplete clear button using the `clearable` argument ([#13](https://github.com/Ambiki/impulse_view_components/pull/13))

### Fixed

- Remove `nil` values from `value` array for multiple select ([#8](https://github.com/Ambiki/impulse_view_components/pull/8))
- Make autocomplete clear button border color same as input's background color ([#9](https://github.com/Ambiki/impulse_view_components/pull/9))
- Autocomplete values should not be cleared when element is removed from the DOM ([#12](https://github.com/Ambiki/impulse_view_components/pull/12))

## [0.1.2] - 2023-07-31

### Changed

- Drop build target to `2017`
- Bump impulse version

## [0.1.1] - 2023-07-31

### Fixed

- Bump impulse version ([#4](https://github.com/Ambiki/impulse_view_components/pull/4))

## [0.1.0] - 2023-07-31

### Added

- Everything!

[unreleased]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Ambiki/impulse_view_components/releases/tag/v0.1.0
