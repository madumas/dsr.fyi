# dsr.fyi
A simple site to track Maker Protocol's DSR rate and usage.

Features:
- List the accounts with the biggest balances
- Automatically update the balance by incrementing balances every second based on current rate, and refreshes with on-chain data every minute
- Query the balance of any address, and detect if a DSProxy is being used.
- Does not run a database and does not use local storage, all data is obtained at startup from an Ethereum node and cached in the server
- Requires an Archive Ethereum node for data syncing
- SSR, unique URLs and sitemap for SEO

Configuration:
Place an `.env` at the root of the project
```
ARCHIVENODEWSURL=<URL of archive node>
REACT_APP_INFURAURL=<Infura URL, or other public Ethereum ndoe>
```
## Docker
```
docker build ./ -t dsr.fyi
docker run -d --restart unless-stopped --name dsrfyi -p 80:3001 dsr.fyi
```

## Gotchas
- Starting the server takes 10-20 minutes. An improvement would be to store the data locally, or use a specialized db like Vulcanize.
- No SSL support in the server.
 
## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

Without the server component, the pages won't show data
### `npm run buildserver`

Builds the server and browser components

### `npm run server`

Run the server component

