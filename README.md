# Scoundrel PWA

An offline-first implementation of the solitaire card game Scoundrel, designed by [Zach Gage](https://x.com/helvetica?lang=en) and [Kurt Bieg](https://www.kurtbieg.com/).

Play at [joelnet.github.io/scoundrel](https://joelnet.github.io/scoundrel/).

[![Scoundrel game table](./docs/scoundrel-gameplay.png)](https://joelnet.github.io/scoundrel/)

## How to Play

[![Watch How to Play Scoundrel](https://i.ytimg.com/vi/Gt2tYzM93h4/maxresdefault.jpg)](https://www.youtube.com/watch?v=Gt2tYzM93h4)

Prefer text? Read the [complete rules](./RULES.md).

## Install

Install Scoundrel from the [live game](https://joelnet.github.io/scoundrel/) to launch it like a native app. After it has loaded successfully once, it is available offline. Mobile play requires landscape orientation.

### Android, macOS, Windows, and Linux

1. Open the live game in your browser.
2. Select the **Install app** icon in the address bar.
3. Follow the on-screen instructions, then launch Scoundrel from your device's application list.

### iPhone/iPad

1. Open the live game in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Enable **Open as Web App**, then tap **Add**.
4. Launch Scoundrel from the Home Screen and rotate the device to landscape.

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
