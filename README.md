# TG Chat (GREEN-API)

Web client for sending and receiving text messages via [GREEN-API](https://green-api.com/) (Telegram).

## Requirements

- Node.js 18+
- A GREEN-API Telegram instance — copy its `idInstance` and `apiTokenInstance` from [console.green-api.com](https://console.green-api.com/).

## Run

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
```

Open the printed local URL, enter `idInstance` and `apiTokenInstance` to log in, then start chatting.
