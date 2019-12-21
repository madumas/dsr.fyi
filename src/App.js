import Main from "./Main"
import React from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

export default function App() {
    return (
        <Router>
            <div>
                <Switch>
                    <Route path="/:add" component={Main}/>
                    <Route path="/" component={Main}/>
                </Switch>
            </div>
        </Router>
    );
}
