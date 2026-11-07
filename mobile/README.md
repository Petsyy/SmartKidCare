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

## EAS Preview Workflow

The first EAS workflow creates an internally distributable Android preview build.
It runs manually, so pushes and pull requests do not consume EAS build resources.

From `mobile/`, validate and run it with:

```bash
eas workflow:validate .eas/workflows/preview.yml
eas workflow:run .eas/workflows/preview.yml
```

The workflow uses the `preview` build profile in `eas.json`. It does not submit
the build to Google Play.

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
