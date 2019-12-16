import React, { Component } from 'react';
import './App.css';
import createMaker from './eth/maker';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentWillMount() {
    const maker = await createMaker();
    await maker.authenticate();
    //const manager = maker.service('mcd:cdpManager')

    this.setState({ maker: maker});
  }

  handleChange = (event) => {
    this.setState({value: event.target.value});

  }

  handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const proxyAddress = await this.state.maker.service('proxy').getProxyAddress(this.state.value);
      const balance = await this.state.maker.service('mcd:savings').balanceOf(proxyAddress);
      this.setState({address: this.state.value, proxy: proxyAddress, balance: balance});
    } catch (e) {
      this.setState({address: undefined, proxy: undefined, balance: '? DAI'});
    }
  }

  address() {
    return this.state.address;
  }

  dsr() {
    const { balance } = this.state;

    if (balance) {

      return balance.toNumber();

    }
    return '?';
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <form onSubmit={this.handleSubmit}>
            <label>
              Ethereum Address:
            <input type="text" value={this.state.value} onChange={this.handleChange} style={{width: 400}} />
            </label>
            <input type="submit" value="Submit" />
          </form>
          <br/>
          <p>
            {`Current address: ${this.state.address}`}
          </p>
          <p>
            {`Proxy address: ${this.state.proxy}`}
          </p>
          <p>
            {`DSR Balance: ${this.dsr()} DAI`}
          </p>

        </header>
      </div>
    );
  }
}

export default App;
