# SmartKidCare Mobile App

Expo Router app for teacher and parent workflows in SmartKidCare.

## Run Locally

From `mobile/`:

```bash
npm install
npm run dev
```

Alternative:

```bash
npm start
```

## Platform Commands

```bash
npm run android
npm run ios
npm run web
```

## API Configuration

Set backend and explorer URLs in:

- `mobile/src/config/config.api.ts`

Optional environment overrides (recommended for network switching):

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_BLOCK_EXPLORER_BASE_URL` (example: `https://sepolia.etherscan.io`)

For physical devices, do not use `localhost`; use a LAN or public backend URL.

## Related Docs

- Project overview: [`../README.md`](../README.md)
- API reference: [`../docs/API.md`](../docs/API.md)
- Troubleshooting: [`../docs/TROUBLESHOOTING.md`](../docs/TROUBLESHOOTING.md)
- Deployment: [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)
