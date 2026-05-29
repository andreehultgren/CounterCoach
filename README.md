# README

## About

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

## Downloads

Grab the latest `countercoach.exe` from the [Releases](../../releases) page.

### Windows SmartScreen warning

The Windows build is currently **unsigned**, so SmartScreen may show a
"Windows protected your PC" popup on first run. This is expected. To run it:

1. Click **More info**
2. Click **Run anyway**

Windows remembers the choice and won't ask again on that machine.

### Verify your download (SHA256)

Each release lists the SHA256 checksum (and ships a `countercoach.exe.sha256`
file). To confirm your download wasn't corrupted or tampered with:

```powershell
Get-FileHash countercoach.exe -Algorithm SHA256
```

Compare the output to the checksum on the release page — they must match.

## Releases (CI)

Pushing a tag like `v1.0.0` triggers `.github/workflows/release.yml`, which
builds the Windows `.exe` and publishes a GitHub Release with the binary and
its SHA256. macOS builds are on hold until an Apple Developer ID certificate
is available (signing/notarization config is preserved in
`build/darwin/entitlements.plist`).
