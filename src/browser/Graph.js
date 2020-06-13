import React, {Component} from "react";
import {Box, withStyles, Typography} from "@material-ui/core";
import {LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Line} from "recharts";
import 'isomorphic-fetch'
import moment from "moment";

const styles = () => ({
  table: {
  },
});

class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    if (props !== undefined && props.rates !== undefined) {
      this.state = {rates: props.rates};
    }
  }

  componentDidUpdate(prevProps, prevState, prevContext) {
    if(prevProps.rates!==this.props.rates) {
      this.setState({rates:this.props.rates});
    }
  }

  render() {
    if (typeof this.state.rates!=='object' || this.state.rates.map===undefined) return '';
    const data = this.state.rates.map(d => {return {time:d.date ,Amount:d.TotDSR, Rate:d.dsr.toFixed(2)}});
    return (
      <div>
        <Box>
          <Typography>
          Savings Rate and total Dai in DSR<p/>
          </Typography>
        </Box>
        <div>
          <Typography>
          <ResponsiveContainer height='90%' width='100%' aspect={4.0/3.0} >
            <LineChart
              data={data}
              margin={{top: 5, right: 20, left: 10, bottom: 5}}
            >
              <XAxis dataKey="time"  tickFormatter={tick=>moment(tick).format('MMM Do YY')}/>
              <YAxis yAxisId={0} orientation={'right'} tickFormatter={tick => {
                return (tick/1000000).toLocaleString()+' M';
              }}/>
              <YAxis yAxisId={1} orientation={'left'} tickFormatter={tick => {
                return tick+'%';
              }}/>
              <Tooltip formatter={value=>value.toLocaleString()}/>
              <CartesianGrid stroke="#f5f5f5"/>
              <Line type="monotone" dataKey="Amount" stroke="#ff7300" yAxisId={0}/>
              <Line type="monotone" dataKey="Rate" stroke="#737300" yAxisId={1}/>
            </LineChart>
          </ResponsiveContainer>
          </Typography>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(Graph);
