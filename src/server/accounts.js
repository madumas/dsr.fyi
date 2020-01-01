import potAbi from '@makerdao/dai-plugin-mcd/contracts/abis/Pot.json';
import proxyAbi from '@makerdao/dai-plugin-mcd/contracts/abis/DSProxy.json';

const abiDecode = require("abi-decoder");
import {sha3, numStringToBytes32, padsig, decodeDSNote, fromWei} from "../utils";

const dict = {
  pot: {
    join: sha3('join(uint256)'),
    exit: sha3('exit(uint256)'),
    fileGlob: sha3('file(bytes32,uint256)') //0x29ae8114
  }
};

let _this;
export default class accounts {
  constructor(web3, mcdConfig) {
    this.addresses = {};
    this.rates = {};
    this.processedFileTx = [];
    this.blockCache={};
    this.web3 = web3;
    _this = this;
    this.mcdConfig = mcdConfig;
    abiDecode.addABI(potAbi);

    this.web3.eth.subscribe('logs', {
      address: [this.mcdConfig.addresses.MCD_POT],
      fromBlock: 'latest'
    }, (error,result)=>{
      if (error) throw error;

      if(result.topics[0].substring(0,10)===dict.pot.join) {
        this._processJoin(result).then(function () {});
      }
    });



  }

  balance(address) {

  }

  proxy(address) {

  }

  async top(count=100) {
    let list=Object.values(_this.addresses).sort((a,b)=>b.balance-a.balance);
    let response=[];
    for(let i=0;i<count;i++) {
      let owner=list[i].owner;
      if (typeof list[i].owner === 'undefined') {
        owner=-1;
        const proxyContract = new _this.web3.eth.Contract(proxyAbi, list[i].address);
        try {
          owner = await proxyContract.methods.owner().call();
        } catch (e) {
          //no proxy
        }
        list[i].owner = owner;
      }
      response.push({addr:list[i].address, proxyOwner:owner, balance:list[i].balance*(this._chi(new Date()/1000))});
    }
    return response;
  }

  _chi(timestamp){
    let last=0;
    let lastData;
    for (let [timeS, data] of Object.entries(this.rates)) {
      const time=Number(timeS);
      if (time<timestamp && time>last) {
        last=time;
        lastData=data;
      }
    }
    return(lastData.chi*Math.pow(lastData.dsr, timestamp-last));
  }

  async _getBlock(blockNumber) {
    if (typeof this.blockCache[blockNumber]==="undefined") {
      this.blockCache[blockNumber] = await _this.web3.eth.getBlock(blockNumber);
    }
    return this.blockCache[blockNumber];
  }

  async _processJoin(result, exit=false) {
    if(result.topics[0]===padsig(dict.pot.exit)) exit=true;
    let decoded=decodeDSNote(result);
    const address = '0x'+decoded.arg1.substring(26);
    let data = _this.web3.eth.abi.decodeParameters(
      [{name: "value",type: "uint256"}],
      decoded.arg2);
    const dai = fromWei(data.value)*(exit?-1:1);//*this._chi((await _this._getBlock(result.blockNumber)).timestamp);
    if(typeof _this.addresses[address]==='undefined') {
      _this.addresses[address] = {
        address:address,
        balance:dai
      };
    } else {
      this.addresses[address].balance += dai;
    }
  }

  async _processFile (logs) {
    for (let index = 0; index < logs.length; index++) {
      const log=logs[index];
      if (this.processedFileTx[log.transactionHash] !== undefined) {
        return false;
      }
      this.processedFileTx[log.transactionHash] = 1;
      let txReceipt = await this.web3.eth.getTransactionReceipt(log.transactionHash);
      let fileData = {};

      if (typeof txReceipt === 'undefined' || txReceipt.status === false) {
        console.log('cannot find file tx ' + transactionHash);
        return false;
      }

      txReceipt.logs.forEach(ev => {
        if (ev.topics[0].substring(0, 10) === dict.pot.fileGlob) {
          let decoded = decodeDSNote(ev);
          let data = this.web3.eth.abi.decodeParameters(
            [
              {name: "what", type: "bytes32"},
              {name: "value", type: "uint256"}],
            decoded.data.substr(10));
          const what = this.web3.utils.toAscii(data.what).replace(/\0/g, '');
          const value = data.value;
          fileData[what] = value;
        }
      });

      if (typeof fileData.dsr !== 'undefined') {
        const dsr = fromWei(fileData.dsr) / 1000000000;
        const rate = Number((Math.pow(dsr, (60 * 60 * 24 * 365)) - 1) * 100);
        const potContract = new _this.web3.eth.Contract(potAbi, _this.mcdConfig.addresses.MCD_POT);
        const chi = fromWei(await potContract.methods.chi().call(txReceipt.blockNumber)) / 1000000000;
        const blockTime = (await _this.web3.eth.getBlock(txReceipt.blockNumber)).timestamp;
        console.log(txReceipt.blockNumber);
        this.rates[blockTime] = {dsr, rate, chi};
      }
    }
  }


  batchFetchFile( blockStart, blockEnd ) {
    return new Promise(function(resolve,reject) {
      _this.web3.eth.getPastLogs({
        address: _this.mcdConfig.addresses.MCD_POT,
        fromBlock: blockStart,
        toBlock: blockEnd,
        topics: [[padsig(dict.pot.fileGlob)]]
      }).then(function (logs) {
          _this._processFile(logs, false).then(resolve)
      }).catch(function (error) {
        console.log(error);
      });
    })
  }

  batchFetchJoin( blockStart, blockEnd ) {
    return new Promise(function(resolve,reject) {
      _this.web3.eth.getPastLogs({
          address: _this.mcdConfig.addresses.MCD_POT,
          fromBlock: blockStart,
          toBlock: blockEnd,
          topics: [[padsig(dict.pot.join),padsig(dict.pot.exit)]]
        }).then(function (logs) {
        logs.forEach(log => {
          _this._processJoin(log, false).then()
        });
        resolve();
      }).catch(function (error) {
        console.log(error);
      });
    })
  }

  async prefetch() {
    const step=5000;
    const stepFile=50000;
    const lastblock = await _this.web3.eth.getBlockNumber();
    const startblock = 8928160;
    console.log('Syncing Pot rates:'+startblock);
    for (let block = startblock; block<lastblock; block+=stepFile) {
      await this.batchFetchFile(block, (lastblock-block < stepFile)?lastblock:block+stepFile)
    }
    console.log("Finished syncing Pot Rates");
    console.log(this.rates);
    console.log('Syncing Pot Join and Exit, starting at block:'+startblock);
    for (let block = startblock; block<lastblock; block+=step) {
      console.log(block);
      await this.batchFetchJoin(block, (lastblock-block < step)?lastblock:block+step)
    }
    console.log("Finished syncing Pot");
    setTimeout(function() {
      _this.top(10).then();
    }, 30000);
  }
}
