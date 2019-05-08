import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import { callbackify } from 'util';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let TEST_ORACLES_COUNT = 20;
let accounts = [];
initialize();

/*web3.eth.getAccounts((error, accts) => {
  accounts = accts;
});*/

initialize()
  {
    this.web3.eth.getAccounts((error, accts) => {
    accounts = accts;
    for(let a=6; a<TEST_ORACLES_COUNT+6; a++) { 
      flightSuretyApp.methods.registerOracle().send({from: accounts[a], value: 1000000000000000000}, (error, result) =>{
      });
      flightSuretyApp.methods.getMyIndexes().call({from: web3.eth.accounts[a]}, (error, result) =>{
        //console.log(`Oracle Registered: ${result}`);
        //callback(error, result);
        console.log(accounts[a], result);
      });
    }
  })

  }


/*
  //let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});

}*/


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error){
      console.log(error);
    }
    console.log(event);

    console.log(accounts[0]);


    /*self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });*/
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
});

app.on('listening', function () {
  console.log('We  are here first!');
});

export default app;


