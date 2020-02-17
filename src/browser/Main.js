import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles'
import {Grid, Paper, Typography, TextField, Box, CircularProgress, Tooltip} from '@material-ui/core'
import './App.css';
import Graph from './Graph.js';
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

const HtmlTooltip = withStyles(theme => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}))(Tooltip);

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
        rates:props.pageData.rates,
        balance:props.pageData.balance,
        proxy:props.pageData.proxy,
        chi:props.pageData.chi,
        rho:props.pageData.rho,
        dsr:props.pageData.dsr,
        count:props.pageData.count
      };
    }
  }

  async fetchData() {
    return (await fetch(this.baseURL + '/api/v1/addresses/top')).json();
  }

  async fetchRateData() {
    return (await fetch('/api/v1/dsr/pot/history')).json();
  }

  async fetchStats() {
    return (await fetch('/api/v1/addresses/stats')).json();
  }

  async componentDidMount() {
    try {
      const maker = await createMaker();
      await maker.authenticate();
      const top = this.state.top || await this.fetchData();
      const rates = this.state.rates || await this.fetchRateData();
      const stats = this.state.stats || await this.fetchStats();
      this.setState({ maker: maker, loading:false, top, rates, stats});
      await this.pullMakerState();
    } catch (e) {
      console.log('Exception while creating Maker: ' +e)
    }

    this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000);
    this.intervalChainData = setInterval(() => this.refreshNumbers(), 60000);

    const { addr } = this.props.match.params;
    if(addr) {
      this.setState({value: addr, initial:true});
    }
  }

  componentDidUpdate(prevProps,prevState) {
    if (this.props.match.params.addr !== prevProps.match.params.addr ) {
      this.setState({value: this.props.match.params.addr});
    }
    if (this.state.value !== prevState.value) {
      this.pullChainData(this.state.initial).then(()=>{this.setState({initial:false})});
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
    this.setState({top:await this.fetchData(), stats:await this.fetchStats()});
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
      this.setState({loading:false});
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState();
    await this.pullChainData();
  };

  address() {
    const { address, loading } = this.state;
    if (address && loading!==true) {
      const url='https://etherscan.io/address/'+address;
      return <div>
        Owner Address: <a href={url} >{address}</a>
      </div>
    }
    return '';
  }

  proxyAddress() {
    const { proxy } = this.state;

    if (proxy) {
      const url='https://etherscan.io/address/'+proxy;
      return <div>
        Proxy Address: <a href={url} >{proxy}</a>
      </div>
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
    const dsrRate = Number((Math.pow(this.state.dsr,60*60*24*365)-1)*100).toFixed(2);
    const count = this.state.stats? this.state.stats.count:0;
        return (
      <div className="Main">
        <Helmet>
          <title>dsr.fyi: View your live DSR Balance</title>
          {canonicalLink}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        </Helmet>
        <Grid container justify="center" spacing={10}>
          <Grid item xs={11} md={8}>
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
          <Grid item xs={11} md={5} >
            <Paper className={classes.paper}>
              <Grid container justify={"center"} spacing={10}>
                <Grid item>
                DSR: <Typography variant="h2">{dsrRate}%</Typography>
                </Grid>
                <Grid item>
                  Accounts:
                <HtmlTooltip
                  title={
                    <React.Fragment>
                      <Typography color="inherit">Address count</Typography>
                     {"Where balance is greater or equal to 1 DAI. "}
                     {"Does not include Chai and similar token addresses"}
                    </React.Fragment>
                  }
                >
                  <Typography variant="h2">{count}</Typography>
                </HtmlTooltip>
                </Grid>
              </Grid>
            </Paper>
            <p/>
            <Paper className={classes.paper}>
              <Graph rates={this.state.rates}/>
            </Paper>
          </Grid>
          <Grid item xs={11} md={5}>
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
