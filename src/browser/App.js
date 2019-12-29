import Main from "./Main"
import React, {Component} from "react";
import { Route, Switch, withRouter } from 'react-router-dom'

class App extends Component {
    constructor(props) {
        super(props);
        this.data = props.data
    }

    render() {
        return(
            <div>
                <Switch>
                    <Route path="/:add" component={Main}/>
                    <Route path="/" component={Main}/>
                </Switch>
            </div>
        );
    }
}


export default withRouter(App);
