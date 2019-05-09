
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from: config.owner});
    await config.flightSuretyData.authorizeCaller(config.firstAirline, {from: config.owner});

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=10; a<TEST_ORACLES_COUNT+10; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let airline = accounts[2];
    let flight = 'ND1309'; // Course number

    // Submit a request for oracles to get status information for a flight
    let r = await config.flightSuretyApp.fetchFlightStatus(airline, flight, config.fixedtimestamp);
    //console.log(`\n\nindex: ${r}`);
    // Watch the emitted event Harvested()
    var event = config.flightSuretyApp.OracleRequest();
    await event.watch((err, res) => {
      console.log(`\n\nOracle Requested: index: ${res.args.index.toNumber()}, airline: ${res.args.airline}, flight:  ${res.args.flight}, timestamp: ${res.args.timestamp.toNumber()}`);
    });

    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=10; a<TEST_ORACLES_COUNT+10; a++) {

      // Get oracle information
      // For a real contract, we would not want to have this capability
      // so oracles can remain secret (at least to the extent one doesn't look
      // in the blockchain data)
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          let count = 0;
            let x = await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], airline, flight, config.fixedtimestamp, 20, { from: accounts[a] });

            var event = config.flightSuretyApp.OracleReport();
            await event.watch((err, res) => {
              console.log(`\n\n Oracle Report: airline: ${res.args.airline}, flight:  ${res.args.flight}, timestamp: ${res.args.timestamp.toNumber()}, status: ${res.args.status.toNumber()}`);
              count = count + 1;
            });

            if(count >= await config.flightSuretyApp.MIN_RESPONSES.call()){
              var event2 = config.flightSuretyApp.FlightStatusInfo();
              await event2.watch((err, result) => {
                console.log(`\n\n Flight Status Available: airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}, status: ${result.args.status.toNumber()}`);
              });

              var event1 = config.flightSuretyData.InsureesCredited();
              await event1.watch((err, res) => {
                console.log(`\n\nInsurees Credited: Count: ${res.args.arrayLength.toNumber()}, airline:  ${res.args.airline}, flight:  ${res.args.flight}, timestamp: ${res.args.timestamp.toNumber()}`);
            });
          }

            
            // Check to see if flight status is available
            // Only useful while debugging since flight status is not hydrated until a 
            // required threshold of oracles submit a response
            let flightStatus = await config.flightSuretyApp.viewFlightStatus.call(airline, flight, config.fixedtimestamp);
            console.log('\nPost', accounts[a], idx, oracleIndexes[idx].toNumber(), airline, flight, config.fixedtimestamp, flightStatus.toNumber());
            if(flightStatus.toNumber()==20){
              console.log('Is late!');
            }
          
        }
        catch(e) {
          // Enable this when debugging
          //console.log('\nError', idx, oracleIndexes[idx].toNumber(), airline, flight, timestamp);
          //console.log(e);
        }

      }
    }


  });


 
});
