# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add `TimeZoneSelectComponent`
- Support grouping options in `SelectComponent` and `AjaxSelectComponent`

### Changed

- Add `box-shadow`, increase group header `font-weight`, and set cursor to `not-allowed` if option is disabled in autocomplete

### Fixed

- Only hide the last opened popover when clicking outside if there are multiple nested popovers
- Focus popover trigger element when event is initiated via user interaction
- Loosely look for focusable elements when clicking outside
- Remove `data-focus-trap-id` attribute from the container after releasing the focus trap

## [0.2.3] - 2023-09-12

### Added

- Support for nested popovers ([#43](https://github.com/Ambiki/impulse_view_components/pull/43))

## [0.2.2] - 2023-09-11

### Fixed

- Remove overflow and padding when dialog is closed via escape key ([#35](https://github.com/Ambiki/impulse_view_components/pull/35))
- Only prevent outside click event if target is not focusable ([#38](https://github.com/Ambiki/impulse_view_components/pull/38))

### Added

- Add `PopoverComponent` ([#36](https://github.com/Ambiki/impulse_view_components/pull/36))
- Add `focus` and `blur` methods to the autocomplete element ([#40](https://github.com/Ambiki/impulse_view_components/pull/40))
- Add `show` and `hide` methods to the autocomplete element ([#41](https://github.com/Ambiki/impulse_view_components/pull/41))

## [0.2.1] - 2023-08-22

### Changed

- `DialogComponent` styles should be similar to Bootstrap's modal component ([#25](https://github.com/Ambiki/impulse_view_components/pull/25))

### Fixed

- Accept `null` as `arrowElement` ([#26](https://github.com/Ambiki/impulse_view_components/pull/26))

## [0.2.0] - 2023-08-17

### Added

- Add `focusTrap` helper ([#17](https://github.com/Ambiki/impulse_view_components/pull/17))
- Add `AnchorComponent` ([#18](https://github.com/Ambiki/impulse_view_components/pull/18))
- Add `DialogComponent` ([#19](https://github.com/Ambiki/impulse_view_components/pull/19))

### Fixed

- Set `initialClickTarget` to `null` when element gets destroyed ([#16](https://github.com/Ambiki/impulse_view_components/pull/16))
- Avoid closing the dialog element when there are nested autocomplete elements which are still open ([#20](https://github.com/Ambiki/impulse_view_components/pull/20))

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

[unreleased]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Ambiki/impulse_view_components/releases/tag/v0.1.0
