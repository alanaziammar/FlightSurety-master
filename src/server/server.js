import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import { callbackify } from 'util';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let TEST_ORACLES_COUNT = 20;
let accounts = [];
//initialize();

/*web3.eth.getAccounts((error, accts) => {
  accounts = accts;
});*/


web3.eth.getAccounts((error, accts) => {
    accounts = accts;
    for(let a=10; a<TEST_ORACLES_COUNT+10; a++) { 
      flightSuretyApp.methods.registerOracle().send({from: accounts[a], value: 1000000000000000000, gas:3000000}, (error, result) =>{
        console.log('Oracle Registered', result, error);
        flightSuretyApp.methods.getMyIndexes().call({from: accounts[a], gas:3000000}, (error, result) =>{
          //console.log(`Oracle Registered: ${result}`);
          //callback(error, result);
          console.log('Oracle Indecis', accounts[a], result, error);
        });
      });
    }
  });


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

    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;

    console.log(index, airline, flight, timestamp);

    for(let a=10; a<TEST_ORACLES_COUNT+10; a++) {

      flightSuretyApp.methods.getMyIndexes().call({from: accounts[a], gas:3000000}, (error, result) =>{
        console.log(accounts[a], result, error);
        if(!error){
          for(let idx=0;idx<3;idx++) {
            console.log(index, result[idx]);
            if(result[idx]==index){
              var randomStatusCode = Math.floor(Math.random() * 6) * 10;
              flightSuretyApp.methods.submitOracleResponse(result[idx], airline, flight, timestamp, randomStatusCode).send({from: accounts[a], gas:3000000}, (error, result) =>{
                //console.log(result, error);
                if(!error){
                  console.log('Response submitted', randomStatusCode);
                } else{
                  console.log('Request no longer open!');
                }
              });
            }
          }
        }
      });
}
  });

flightSuretyApp.events.OracleReport({
  fromBlock: 0
}, function (error, event) {
  if (error){
    console.log(error);
  }
  //console.log(event);
  let airline = event.returnValues.airline;
  let flight = event.returnValues.flight;
  let timestamp = event.returnValues.timestamp;
  let status = event.returnValues.status;
  console.log('status submitted:');
  if(status==0){
    console.log('STATUS_CODE_UNKNOWN');
  } else if(status==10){
    console.log('STATUS_CODE_ON_TIME');
  } else if(status==20){
    console.log('STATUS_CODE_LATE_AIRLINE');
  } else if(status==30){
    console.log('STATUS_CODE_LATE_WEATHER');
  } else if(status==40){
    console.log('STATUS_CODE_LATE_TECHNICAL');
  } else if(status==50){
    console.log('STATUS_CODE_LATE_OTHER');
  }

});

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: 0
}, function (error, event) {
  if (error){
    console.log(error);
  }
  //console.log(event);
  let airline = event.returnValues.airline;
  let flight = event.returnValues.flight;
  let timestamp = event.returnValues.timestamp;
  let status = event.returnValues.status;
  console.log('status updated:');
  if(status==0){
    console.log('STATUS_CODE_UNKNOWN');
  } else if(status==10){
    console.log('STATUS_CODE_ON_TIME');
  } else if(status==20){
    console.log('STATUS_CODE_LATE_AIRLINE');
    flightSuretyData.events.InsureesCredited({
      fromBlock: 0
    }, function (error, event) {
      if (error){
        console.log(error);
      }
      let numPassengers = event.returnValues.arrayLength;
      console.log('Passengers Refunded: ', numPassengers);
    });
  } else if(status==30){
    console.log('STATUS_CODE_LATE_WEATHER');
  } else if(status==40){
    console.log('STATUS_CODE_LATE_TECHNICAL');
  } else if(status==50){
    console.log('STATUS_CODE_LATE_OTHER');
  }

});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
});

export default app;


