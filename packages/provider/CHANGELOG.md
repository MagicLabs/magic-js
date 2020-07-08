## Upcoming Changes

#### Fixed

- ...

#### Changed

- ...

#### Added

- WebAuthn support feature

## `2.2.0` - 06/25/2020

#### Changed

- Update dependencies.
- Marked `encodeQueryParameters` and `decodeQueryParameters` utility methods for deprecation in `v3.0.0`.

#### Added

- Add `MagicExtensionWarning` class.
- Add `createWarning` and `createDeprecationWarning` helper methods to `BaseExtension`.
- Add `encodeJSON` and `decodeJSON` helper methods to `BaseExtension.utils`. These are direct aliases for `encodeQueryParameters` and `decodeQueryParameters` (which will be deprecated in the next major version).

## `2.1.2` - 06/23/2020

#### Changed

- `MagicRPCError.code` can now be typed as a plain `number` for greater flexibility.

## `2.1.1` - 06/23/2020

#### Changed

- The argument type given to the default `"error"` event of `PromiEvent` is now `any` (in line with native Promise typings).

## `2.1.0` - 06/23/2020

#### Added

- Add the `BaseExtension.createError` method.
- You are now able to attach arbitrary, strongly-typed data to `MagicExtensionError` objects.

## `2.0.0` - 06/22/2020

#### Added

- The following utilities are now exposed on the `Extension` base class: `createPromiEvent`, `decodeQueryParameters`, `encodeQueryParameters`.

#### Changed

- The `createJsonRpcRequestPayload` and `standardizeJsonRpcRequestPayload` utilities are now nested under the `utils` field of the `Extension` base class.

## `1.0.3` - 06/16/2020

#### Added

- Introduced `MagicExtensionError` type to create consistency for errors rising from Magic SDK Extensions.
- Add the `BaseExtension.raiseError` method.

## `1.0.2` - 06/12/2020

#### Changed

- Update dependencies.
- Circle CI tag in readme is broken after namechange from MagicHQ to MagicLabs

## `1.0.1` - 06/11/2020

#### Changed

- Update dependencies.

## `1.0.0` - 06/02/2020

This is the first release our changelog records. Future updates will be logged in the following format:

#### Fixed

- Bug fixes and patches will be described here.

#### Changed

- Changes (breaking or otherwise) to current APIs will be described here.

#### Added

- New features or APIs will be described here.
