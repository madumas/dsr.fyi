import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles'
import {Grid, Paper, Typography, TextField, Box, CircularProgress} from '@material-ui/core'
import './App.css';
import createMaker from '../eth/maker';
import { RAY } from '@makerdao/dai/dist/src/utils/constants';
import BigNumber from 'bignumber.js';
import { Helmet } from 'react-helmet-async'

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'left',
    color: theme.palette.text.secondary,
  },
  balance: {
    verticalAlign: 'middle',
    textAlign: 'center'
  },
  proxy: {
    fontSize: 'x-small'
  },
  progress: {
    verticalAlign: 'middle',
    textAlign: 'center'
  }
});

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    if(props.pageData!==undefined && props.pageData.addr!=undefined) {
      const address = String(props.pageData.addr).toLowerCase();
      this.state={value: props.pageData.addr, address: address};
    }
    console.log('Initial state:' +JSON.stringify(this.state))
  }

  async componentDidMount() {
    try {
      const maker = await createMaker();
      await maker.authenticate();
      this.setState({ maker: maker, loading:false});
    } catch (e) {
      console.log('Exception while creating Maker: ' +e)
    }

    this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000);
    this.intervalChainData = setInterval(() => this.pullChainData(false), 60000);

    const { addr } = this.props.match.params;
    if(addr) {
      this.setState({value: addr});
      await this.pullChainData(false);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearInterval(this.intervalChainData);
  }

  handleChange = (event) => {
    this.setState({value: event.target.value});
  };

  async pullChainData(loadingIndicator=true) {
    try {
      if(this.state.value) {
        const address = String(this.state.value).toLowerCase();
        loadingIndicator && this.setState({loading: true});
        const proxyAddress = await this.state.maker.service('proxy').getProxyAddress(address);
        const balance = await this.state.maker.service('mcd:savings').balanceOf(proxyAddress || address);
        const rho = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').rho());
        const dsr = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').dsr()).div(RAY);
        this.setState({
            address: this.state.value,
            proxy: proxyAddress,
            balance: balance,
            rho: rho,
            dsr: dsr,
            loading: false
        });
      }
    } catch (e) {
      console.log('Exception while pullChainData: '+e);
      this.setState({proxy: undefined, balance: '? DAI', rho:0, dsr:1,loading:false});
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState()
    await this.pullChainData();
  };

  address() {
    const { address, loading } = this.state;
    if (address && loading!==true) {
      return "Owner Address: " + address;
    }
    return '';
  }

  proxyAddress() {
    const { proxy, loading } = this.state;

    if (proxy && loading===false) {
      return "Proxy Address: " + proxy;
    }
    return '';
  }

  dsr() {
    const { balance, loading } = this.state;

    if (balance && balance.toNumber && loading===false) {
      const adjustedBalance = Number(Math.pow(this.state.dsr.toNumber(),(new Date()/1000)-this.state.rho)*balance.toNumber());
      return adjustedBalance.toLocaleString("en-EN", {
        maximumFractionDigits: 7,
        minimumFractionDigits: 7
      })+ " DAI";
    }
    return '';
  }

  loading() {
    const {loading} = this.state;
    if (loading) {
      return (<CircularProgress />)
    }
  }

  render() {
    const { classes } = this.props;
    const canonicalURL = "https://0xna.me/"+this.state.address;
    const canonicalLink = this.state.address?<link rel="canonical" href= {canonicalURL}/>:'';
        return (
      <div className="Main">
        <Helmet>
          <title>dsr.fyi: View your live DSR Balance</title>
          {canonicalLink}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        </Helmet>
        <Grid container justify="center" spacing={10}>
          <Grid item >
            <Paper className={classes.paper}>
              <Typography>
                View the live Dai Savings Rates (DSR) balance of an Ethereum Address.
              </Typography>
              <br/>
              <form onSubmit={this.handleSubmit}>
                <TextField
                           label="Ethereum Address"
                           variant="outlined"
                           fullWidth
                           value={this.state.value}
                           onChange={this.handleChange}
                           InputLabelProps={{
                             shrink: true,
                           }}
                />
              </form>
              <br/>
              <div className={classes.proxy}>
                {this.address()}
              </div>
              <div className={classes.proxy}>
                {this.proxyAddress()}
              </div>
              <div className={classes.progress}>
                {this.loading()}
              </div>
              <h1 className={classes.balance}>
                <Typography>
                <Box fontFamily={"monospace"} fontSize={24} fontWeight="fontWeightBold">
                {this.dsr()}
                </Box>
                </Typography>
              </h1>
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(Main);
