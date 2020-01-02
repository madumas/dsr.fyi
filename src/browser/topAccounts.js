import React, { Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {Box} from "@material-ui/core";

const styles = theme => ({
  table: {
    minWidth: 650,
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
      promises.push( new Promise((resolve,reject)=>{
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
    return;
  }

  top10() {
    if (!this.props.top) return [];

    let accounts=[];
    this.props.top.forEach(row => {
      const addr=row.addr;
      const displayAddr = row.proxyOwner===-1 ? row.addr : row.proxyOwner;
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
      accounts.push({addr,displayAddr,balance,displayBalance});
    });
    accounts.sort((a,b)=>b.balance-a.balance);
    return accounts.slice(0,10);
  }

  render() {
    const { classes } = this.props;
    const rows = this.top10();
    return (
      <div>
        <Box>
          Top DSR accounts
        </Box>
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
                    <a href={'/'+row.displayAddr}>{row.displayAddr}</a>
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

