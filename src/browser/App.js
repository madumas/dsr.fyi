import Main from "./Main"
import React, {Component} from "react";
import { Route, Switch, withRouter } from 'react-router-dom'

class App extends Component {
    constructor(props) {
        super(props);
        this.data = props.data
    }

    componentDidUpdate(prevProps) {
        this.data=undefined
    }

    render() {
        return(
            <div>
                <Switch>
                    <Route path="/:addr" render={(props) => <Main {...props} pageData={this.data} location={this.props.location}/>}/>
                    <Route path="/" render={(props) => <Main {...props} pageData={this.data} location={this.props.location}/>}/>
                </Switch>
            </div>
        );
    }
}

export default withRouter(App);
