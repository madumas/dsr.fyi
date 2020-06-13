import React from 'react';
import './index.css';
import App from './browser/App';
import * as serviceWorker from './serviceWorker';
import { hydrate } from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom'

// Grab the state from a global variable injected into the server-generated HTML
const preloadedState = window.__PRELOADED_STATE__;

// Allow the passed state to be garbage-collected
delete window.__PRELOADED_STATE__;

hydrate(
    <HelmetProvider>
        <BrowserRouter>
            <App data={preloadedState}/>
        </BrowserRouter>
    </HelmetProvider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
