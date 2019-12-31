import React from "react"
import ReactDOMServer from "react-dom/server"
import { StaticRouter } from 'react-router-dom'
import App from '../browser/App.js'
import '../index.css'
import theme from '../theme';
import accounts from './accounts'
const Web3 = require("web3");

import saiProdAddresses from '@makerdao/dai/dist/contracts/addresses/mainnet'
import prodAddresses from '@makerdao/dai-plugin-mcd/contracts/addresses/mainnet';

import {
  ServerStyleSheets,
  ThemeProvider
} from '@material-ui/core/styles';
import express from 'express'
import morgan from 'morgan'
import { HelmetProvider } from 'react-helmet-async'

require('dotenv').config();
const app = express();

let wsprovider = "wss://mainnet.infura.io/ws/v3/f9c5c0daaf2243b497c55c1ed8372d63";//;//'ws://ethereum:8546';
let mcdConfig={};
mcdConfig.addresses = prodAddresses;
mcdConfig.saiAddresses = saiProdAddresses;

let ws,web3,accountCache
async function connect() {
  console.log("connect");
  ws = new Web3.providers.WebsocketProvider(wsprovider, {
    clientConfig:
      {
        maxReceivedFrameSize: 100000000,
        maxReceivedMessageSize: 100000000,
      }
  });
  ws.on('end', e => {
    console.log('Socket is closed. Reconnect will be attempted in 10 seconds.', e.reason);
    setTimeout(function () {
      connect();
    }, 10000);
  });

  ws.on('error', err => {
    console.error('Socket encountered error: ', err.message, 'Closing socket  and reconnect');
  });

  ws.on('connect', function () {
    console.log('WS Connected');
    web3 = new Web3(ws);
    accountCache = new accounts(web3, mcdConfig);
    accountCache.prefetch().then();
  });
}

connect().then(function(){});


app.set('port', (process.env.WEBPORT || 3001));

// Express only serves static assets in production
//if (process.env.NODE_ENV === 'production') {
//  app.use(express.static('browser/build'))
//}
app.use(morgan('combined'));

app.get('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /api/");
});

app.use(express.static("publicbuild"));
app.use(express.static("public_all"));

async function renderOtherPage(req,res) {
  const addr = req.params.addr ? '0x'+String(req.params.addr).toLowerCase() : undefined;
  const sheets = new ServerStyleSheets();
  const helmetContext = {};
  const pageData = {addr:addr,top:await accountCache.top(20)};
  const reactDom = ReactDOMServer.renderToString(
      sheets.collect(
        <HelmetProvider context={helmetContext}>
          <ThemeProvider theme={theme}>
            <StaticRouter location={req.url} context={{}}>
              <App data={pageData}/>
            </StaticRouter>
          </ThemeProvider>
        </HelmetProvider>
      )
  );
  // Grab the CSS from our sheetsRegistry.
  const css = sheets.toString();
  const html = renderFullPage( reactDom );
  const { helmet } = helmetContext;

  res.send(`
  <!doctype html>
  <html ${helmet.htmlAttributes.toString()}>
  <head>
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    <style id="jss-server-side">${css}</style>
    <meta  name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no">
  </head>
  <body ${helmet.bodyAttributes.toString()}>
    <div id=”app”>${html}</div>
  </body>
            <script>
          // WARNING: See the following for security issues around embedding JSON in HTML:
          // http://redux.js.org/recipes/ServerRendering.html#security-considerations
          window.__PRELOADED_STATE__ = ${JSON.stringify(pageData).replace(
      /</g,
      '\\\\\u003c'
  )}
        </script>
            <script src="/bundle.js" defer></script>
  </html>
    `);
}
app.get('/0x:addr([A-Z][a-z]*[A-Z][a-z]*[A-Z][a-z]*)', (req,res) => {
  renderOtherPage(req,res)
})
app.get('*', (req,res) => {
  renderOtherPage(req,res)
});
app.get('/', (req,res) => {
  renderOtherPage(req,res)
});



app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
})

function renderFullPage(html) {
  return `



        <div id="root">${html}</div>
        


  `;
}
