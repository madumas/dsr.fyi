import React, { Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import {Box, Typography, Paper, TableRow, TableHead} from "@material-ui/core";
import {TableContainer, TableCell, TableBody, Table} from "@material-ui/core";
import {Link} from "react-router-dom";

const styles = () => ({
  table: {
    //minWidth: 650,
  },
});

class TopAccounts extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    if(props!==undefined && props.top!== undefined) {
      this.state={top: props.top};
    }
  }

  componentDidUpdate(prevProps, prevState, prevContext) {
    if(prevProps.top!==this.props.top || prevProps.maker!==this.props.maker) {
      this.fetchAccounts().then();
    }
  }

  async fetchAccounts() {
    const promises=[];
    if (!this.props.maker || !this.props.top) return;
    this.props.top.forEach(row => {
      promises.push( new Promise((resolve)=>{
        this.props.maker.service('mcd:savings').balanceOf(row.addr).then(balance=>{
          resolve({addr:row.addr,proxyOwner:row.proxyOwner, balance});
        });
      }))
    });
    Promise.all(promises).then(balanceData => {
      const balances=[];
      balanceData.forEach(bal => {
        balances.push([bal.addr,bal.proxyOwner,bal.balance.toNumber()]);
      });
      this.setState({balances});
    });
  }

  top20() {
    if (!this.props.top) return [];

    let accounts=[];
    this.props.top.forEach(row => {
      const addr=row.addr;
      const linkAddr = row.proxyOwner===-1 ? row.addr : row.proxyOwner;
      const displayAddr = String(linkAddr).substring(0,15)+"...";
      let balance = row.balance;
      if(this.state.balances && this.props.dsr && this.props.rho && this.props.time) {
        let storeBal = this.state.balances.find(el=>(el[0]===addr||el[1]===addr));
        if (storeBal) {
          balance = Number(storeBal[2]) * Number(Math.pow(this.props.dsr.toNumber(), (this.props.time / 1000) - this.props.rho));
        }
      }
      const displayBalance=balance.toLocaleString("en-EN", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 3
      })+ " DAI";
      accounts.push({addr,displayAddr,balance,displayBalance,linkAddr});
    });
    accounts.sort((a,b)=>b.balance-a.balance);
    return accounts.slice(0,20);
  }

  render() {
    const { classes } = this.props;
    const rows = this.top20();
    return (
      <div>
        <Typography>
          <Box>
            Top DSR accounts
          </Box>
        </Typography>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.addr}>
                  <TableCell component="th" scope="row">
                    <Typography>
                      <Box fontFamily={"monospace"} fontSize={"smaller"}>
                        <Link to={'/'+row.linkAddr}>{row.displayAddr}</Link>
                      </Box>
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.displayBalance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
}

export default withStyles(styles)(TopAccounts);

