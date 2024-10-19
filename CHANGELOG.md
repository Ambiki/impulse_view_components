# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Cache autocomplete options if they are fetched remotely

## [0.5.1] - 2024-05-14

### Fixed

- Specify autocomplete input placeholder color ([#109](https://github.com/Ambiki/impulse_view_components/pull/109))
- Show autocomplete loading state when fetching options remotely ([#108](https://github.com/Ambiki/impulse_view_components/pull/108))

## [0.5.0] - 2024-04-15

### Added

- Add `data-text` attribute to autocomplete group container ([#97](https://github.com/Ambiki/impulse_view_components/pull/97))

### Fixed

- Mark dialog title's margin as important ([#102](https://github.com/Ambiki/impulse_view_components/pull/102))
- Nested dialog resets `body` padding ([#99](https://github.com/Ambiki/impulse_view_components/pull/99))
- Inherit `namespace` value from parent `impulse_form_with` ([#96](https://github.com/Ambiki/impulse_view_components/pull/96))

## [0.4.0] - 2024-03-05

### Changed

- Make dialog ready for usage ([#86](https://github.com/Ambiki/impulse_view_components/pull/86))

## [0.3.1] - 2024-03-01

### Changed

- Avoid rendering Popover's header by default ([#74](https://github.com/Ambiki/impulse_view_components/pull/74))
- Use [`popover`](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) API in `PopoverComponent` ([#73](https://github.com/Ambiki/impulse_view_components/pull/73))

### Fixed

- Disabled autocomplete option's description color ([#85](https://github.com/Ambiki/impulse_view_components/pull/85))

## [0.3.0] - 2023-12-21

### Added

- Add description to `AutocompleteComponent` ([#55](https://github.com/Ambiki/impulse_view_components/pull/55))
- Add `TimeZoneSelectComponent` ([#53](https://github.com/Ambiki/impulse_view_components/pull/53))
- Support grouping options in `SelectComponent` and `AjaxSelectComponent` ([#52](https://github.com/Ambiki/impulse_view_components/pull/52))

### Changed

- Replace autocomplete's svg icons with bootstrap icons ([#61](https://github.com/Ambiki/impulse_view_components/pull/61))
- Add `box-shadow`, increase group header `font-weight`, and set cursor to `not-allowed` if option is disabled in autocomplete ([#54](https://github.com/Ambiki/impulse_view_components/pull/54))

### Fixed

- Remove `data-focus-trap-id` attribute from the container after releasing the focus trap ([#51](https://github.com/Ambiki/impulse_view_components/pull/51))
- Loosely look for focusable elements when clicking outside ([#47](https://github.com/Ambiki/impulse_view_components/pull/47))
- Focus popover trigger element when event is initiated via user interaction ([#46](https://github.com/Ambiki/impulse_view_components/pull/46))
- Only hide the last opened popover when clicking outside if there are multiple nested popovers ([#45](https://github.com/Ambiki/impulse_view_components/pull/45))

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

[unreleased]: https://github.com/Ambiki/impulse_view_components/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Ambiki/impulse_view_components/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Ambiki/impulse_view_components/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Ambiki/impulse_view_components/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Ambiki/impulse_view_components/releases/tag/v0.1.0
