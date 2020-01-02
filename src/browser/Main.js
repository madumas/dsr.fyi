import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles'
import {Grid, Paper, Typography, TextField, Box, CircularProgress} from '@material-ui/core'
import './App.css';
import TopAccounts from "./topAccounts";
import createMaker from '../eth/maker';
import { RAY } from '@makerdao/dai/dist/src/utils/constants';
import BigNumber from 'bignumber.js';
import { Helmet } from 'react-helmet-async'
import 'isomorphic-fetch'

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
    let req = props.match.req;
    this.baseURL= req ? `${req.protocol}://${req.get('Host')}` : '';
    if(props.pageData!==undefined) {
      const address = props.pageData.addr?String(props.pageData.addr).toLowerCase():undefined;
      this.state={
        value: props.pageData.addr,
        address: address,
        top:props.pageData.top,
        balance:props.pageData.balance,
        proxy:props.pageData.proxy,
        chi:props.pageData.chi,
        rho:props.pageData.rho,
        dsr:props.pageData.dsr
      };
    }
  }

  async fetchData() {
    const data = (await fetch(this.baseURL + '/api/v1/addresses/top')).json();
    return data;
  }

  async componentDidMount() {
    try {
      const maker = await createMaker();
      await maker.authenticate();
      const top = this.state.top || await this.fetchData();
      this.setState({ maker: maker, loading:false, top})
      await this.pullMakerState();
    } catch (e) {
      console.log('Exception while creating Maker: ' +e)
    }

    this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000);
    this.intervalChainData = setInterval(() => this.refreshNumbers(), 60000);

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

  async pullMakerState() {
    const chi = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').chi()).div(RAY);
    const rho = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').rho());
    const dsr = new BigNumber(await this.state.maker.service('mcd:savings').get('smartContract').getContract('MCD_POT').dsr()).div(RAY);
    this.setState({chi,rho,dsr});
  }

  async refreshNumbers() {
    this.setState({top:await this.fetchData()});
    await this.pullChainData(false)
  }

  async pullChainData(loadingIndicator=true) {
    try {
      if(this.state.value) {
        const address = String(this.state.value).toLowerCase();
        loadingIndicator && this.setState({loading: true});
        await this.pullMakerState();
        const proxyAddress = await this.state.maker.service('proxy').getProxyAddress(address);
        const balance = await this.state.maker.service('mcd:savings').balanceOf(proxyAddress || address);
        this.setState({
            address: this.state.value,
            proxy: proxyAddress,
            balanceInt: balance,
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

    if (proxy) {
      return "Proxy Address: " + proxy;
    }
    return '';
  }

  dsr() {
    const { balance, loading, balanceInt } = this.state;

    if (balanceInt && balanceInt.toNumber) {
      if (loading===false) {
        const adjustedBalance = Number(Math.pow(this.state.dsr.toNumber(), (new Date() / 1000) - this.state.rho) * balanceInt.toNumber());
        return adjustedBalance.toLocaleString("en-EN", {
          maximumFractionDigits: 7,
          minimumFractionDigits: 7
        }) + " DAI";
      }
      return '';
    }
    if (balance && this.state.rho && this.state.chi && this.state.dsr) { //SSR balance
      const adjustedChi = Number(this.state.chi * Math.pow(this.state.dsr,(new Date()/1000)-this.state.rho));
      return (balance*adjustedChi).toLocaleString("en-EN", {
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
          <Grid item >
            <Paper className={classes.paper}>
              <TopAccounts top={this.state.top} rho={this.state.rho} dsr={this.state.dsr} maker={this.state.maker} time={this.state.time} />
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(Main);
