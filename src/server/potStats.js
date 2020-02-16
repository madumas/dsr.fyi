import DateBlock from 'dateblock'
import potAbi from '@makerdao/dai-plugin-mcd/contracts/abis/Pot.json';
import {fromWei} from "../utils";

let _this;

export default class potStats {
  constructor(web3, mcdConfig) {
    _this=this;
    this.web3 = web3;
    this.bigPie = [];
    _this = this;
    this.mcdConfig = mcdConfig;
    this.potContractInst =  new web3.eth.Contract(potAbi, mcdConfig.addresses.MCD_POT);

  }

  blockInfo(date) {
    return new Promise((resolve)=> {
      let dateblock = new DateBlock(_this.web3);
      dateblock.getBlock(date).then(block => {
        let promises = [];

        promises[0] = new Promise(function (resolve) {
          _this.potContractInst.methods.Pie().call({}, block.number).then(pie => {
              resolve(fromWei(pie));
          }).catch(function (err) {
              console.log(err);
              resolve(0);
          })
        });
        promises[1] = new Promise(function (resolve) {
          _this.potContractInst.methods.chi().call({}, block.number).then(chi => {
            resolve(fromWei(chi)/1000000000);
          }).catch(function (err) {
            console.log(err);
            resolve(0);
          })
        });
        promises[2] = new Promise(function (resolve) {
          _this.potContractInst.methods.dsr().call({}, block.number).then(chi => {
            resolve(100*(Math.pow(fromWei(chi)/1000000000,60*60*24*365)-1));
          }).catch(function (err) {
            console.log(err);
            resolve(0);
          })
        });

        Promise.all(promises).then(results => {
          this.bigPie.push({
            date: new Date(date),
            Pie: results[0],
            chi: results[1],
            dsr: results[2],
            TotDSR: results[0]*results[1]
          });
          resolve(1);
        })
      })
    })
  }

  async batchFetch( dateStart, dateEnd ) {
    console.log('Starting pot Stats Sync');
    let date = dateStart;
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    do {
        await this.blockInfo(date);
        date.setHours(date.getHours()+12);
    }
    while(date<dateEnd);
    console.log('Finished pot Stats Sync');
  }

  history() {
    return this.bigPie;
  }

  async update(date) {
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    await this.blockInfo(date);
  }

}
