import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import './App.css';
import createMaker from './eth/maker';
import { RAY } from '@makerdao/dai/dist/src/utils/constants';
import BigNumber from 'bignumber.js';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'left',
    color: theme.palette.text.secondary,
  }
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const maker = await createMaker();
    await maker.authenticate();
    //const manager = maker.service('mcd:cdpManager')

    this.setState({ maker: maker});
    this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }


  handleChange = (event) => {
    this.setState({value: event.target.value});
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const proxyAddress = await this.state.maker.service('proxy').getProxyAddress(this.state.value);
      const balance = await this.state.maker.service('mcd:savings').balanceOf(proxyAddress||this.state.value);
      const rho = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').rho());
      const dsr = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').dsr()).div(RAY);
      this.setState({address: this.state.value, proxy: proxyAddress, balance: balance, rho: rho, dsr: dsr});
    } catch (e) {
      console.log(e);
      this.setState({address: undefined, proxy: undefined, balance: '? DAI', rho:0, dsr:1});
    }
  };

  proxyAddress() {
    const { proxy } = this.state;

    if (proxy) {
      return "Proxy Address: " + proxy;
    }
    return '';
  }

  dsr() {
    const { balance } = this.state;

    if (balance && balance.toNumber) {
      const adjustedBalance = Number(Math.pow(this.state.dsr.toNumber(),(new Date()/1000)-this.state.rho)*balance.toNumber());
      return "DSR Balance: " + adjustedBalance.toLocaleString("en-EN", {
        maximumFractionDigits: 7,
        minimumFractionDigits: 7
      })+ " DAI";
    }
    return '';
  }

  render() {
    const { classes } = this.props;
        return (
      <div className="App">
        <Grid container justify="center" spacing={16}>
          <Grid item >
            <Paper className={classes.paper}>
              <p>
                View the DSR balance of an Ethereum Address in DAI.
              </p>
              <form onSubmit={this.handleSubmit}>
                <label>
                  Ethereum Address:
                <input type="text" value={this.state.value} onChange={this.handleChange} style={{width: 400}} />
                </label>
                <input type="submit" value="Submit" />
              </form>
              <br/>
              <p>
                {this.proxyAddress()}
              </p>
              <p>
                {this.dsr()}
              </p>
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(App);
