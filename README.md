# Scoundrel PWA

An offline-first implementation of the solitaire card game Scoundrel, designed by [Zach Gage](https://x.com/helvetica?lang=en) and [Kurt Bieg](https://www.kurtbieg.com/).

Play at [joelnet.github.io/scoundrel](https://joelnet.github.io/scoundrel/).

[![Scoundrel game table](./docs/scoundrel-gameplay.png)](https://joelnet.github.io/scoundrel/)

## How to Play

[![Watch How to Play Scoundrel](https://i.ytimg.com/vi/Gt2tYzM93h4/maxresdefault.jpg)](https://www.youtube.com/watch?v=Gt2tYzM93h4)

Prefer text? Read the [complete rules](./RULES.md).

## Install

Install Scoundrel from the [live game](https://joelnet.github.io/scoundrel/) to launch it like a native app. After it has loaded successfully once, it is available offline. Mobile play requires landscape orientation.

### Android

1. Open the live game in Chrome.
2. Tap **More** (`...`) > **Install and create shortcut** > **Install**. On some Chrome versions, choose **Add to Home screen** > **Install** instead.
3. Follow the on-screen instructions, then launch Scoundrel from the home screen or app drawer.

### iOS and iPadOS

1. Open the live game in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Enable **Open as Web App**, then tap **Add**.
4. Launch Scoundrel from the Home Screen and rotate the device to landscape.

### Windows

1. Open the live game in Microsoft Edge.
2. Select the **App available** icon in the address bar.
3. Select **Install**. Scoundrel will be available from the Start menu and can be pinned to the taskbar.

### Linux

1. Open the live game in Chrome.
2. Select the **Install** icon in the address bar. If it is not shown, open **More** (`...`) > **Cast, save, and share** > **Install page as app**.
3. Confirm the installation and launch Scoundrel from the desktop application menu.

### macOS

1. On macOS Sonoma 14 or later, open the live game in Safari.
2. Choose **File** > **Add to Dock**, then select **Add**.
3. Launch Scoundrel from the Dock, Spotlight, or the Applications folder.

On an older macOS version, use Chrome and choose **More** (`...`) > **Cast, save, and share** > **Install page as app**.

## Development

```bash
npm install
npm run dev
```

Run tests and create a production build:

```bash
npm run test:run
npm run build
```

See [RULES.md](./RULES.md) for complete game rules and attribution.
