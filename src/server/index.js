import React from "react"
import ReactDOMServer from "react-dom/server"
import { StaticRouter } from 'react-router-dom'
import App from '../browser/App.js'
import '../index.css'
import theme from '../theme';
import accounts from './accounts'
import potStats from './potStats'
const Web3 = require("web3");
import cron from 'node-cron';

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

let wsprovider = process.env.ARCHIVENODEWSURL;
let mcdConfig={};
mcdConfig.addresses = prodAddresses;

let ws,web3,accountCache, potH;
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
    potH = new potStats(web3, mcdConfig);
    potH.batchFetch(new Date(Date.UTC(2019,10,18,0,0,0,0)), new Date());
  });
}

connect().then(function(){});

cron.schedule('5 */12 * * *', () => {
  potH.update(new Date())
},{timezone: "Etc/UTC"});

app.set('port', (process.env.WEBPORT || 3001));

app.use(morgan('combined'));

app.get('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /api/\nSitemap: http://dsr.fyi/sitemap.txt");
});

app.use(express.static("publicbuild"));
app.use(express.static("public_all"));

app.get('/api/v1/addresses/top', (req, res) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.set('Cache-Control', 'public, max-age=30');
  accountCache.top(20).then((data) => {
    res.json(data)
  })
});

app.get('/api/v1/addresses/stats', (req, res) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({count:accountCache.count()});
});

app.get('/api/v1/dsr/pot/history', (req, res) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.set('Cache-Control', 'public, max-age=30');
  res.json(potH.history());
});

app.get('/api/v1/dsr/rates', (req, res) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.set('Cache-Control', 'public, max-age=30');
  res.json(accountCache.rates);
});

app.get('/sitemap.txt', (req, res) => {
  res.type('text/plain');
  const list = accountCache.list();
  res.send(list.reduce((txt,row)=>txt+'\nhttps://dsr.fyi/'+row.address,''));
});

async function renderOtherPage(req,res) {
  const addr = req.params.addr ? '0x'+String(req.params.addr).toLowerCase() : undefined;
  const sheets = new ServerStyleSheets();
  const helmetContext = {};

  const proxy = addr?await accountCache.proxy(addr):undefined;
  const balance =  addr?accountCache.balance(proxy||addr):undefined;

  const rates = potH.history();
  const [chi,dsr,rho] = accountCache.lastChi();
  const count = accountCache.count();
  const pageData = {addr:addr,proxy,balance,chi,rho,dsr,count,rates,top:await accountCache.top(25)};
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

  res.set('Cache-Control', 'public, max-age=30');
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
app.get('/0x:addr([a-fA-F0-9]{40}$)', (req,res) => {
  renderOtherPage(req,res)
});
app.get('/', (req,res) => {
  renderOtherPage(req,res)
});



app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
});

function renderFullPage(html) {
  return `



        <div id="root">${html}</div>
        


  `;
}
