
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from: config.owner});
    await config.flightSuretyData.authorizeCaller(config.firstAirline, {from: config.owner});

    let events = config.flightSuretyData.allEvents();
    events.watch((error, result) => {
      if (result.event === 'StatusChange') {
        console.log(`\n\n FSD: StatusChange: newStatus: ${result.args.newStatus}, votesNum:  ${result.args.votesNum.toNumber()}}`);
      } else if (result.event === 'AirlineRegistered') {
        console.log(`\n\n FSD: AirlineRegistered: airline: ${result.args.airline}, votesNum:  ${result.args.votesNum.toNumber()}}`);
      } else if (result.event === 'AirlineActivated') {
        console.log(`\n\n FSD: AirlineActivated: airline: ${result.args.airline}, existingFund: ${result.args.existingFund.toNumber()}}`);
      } else if (result.event === 'FlightRegistered') {
        console.log(`\n\n FSD: Flight Registered: airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}`);
      } else if (result.event === 'InsuranceBought') {
        console.log(`\n\n FSD: Insurance Bought: caller: ${result.args.caller}, amount: ${result.args.amount.toNumber()}, airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}`);
      } else if (result.event === 'InsureesCredited') {
        console.log(`\n\n FSD: Insurees Credited: Count: ${result.args.arrayLength.toNumber()}, airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}`);
      } else if (result.event === 'PassengerPaid') {
        console.log(`\n\n FSD: Passenger Paid: passenger: ${result.args.passenger}, amount: ${result.args.amount.toNumber()}`);
      } /*else if (result.event === 'OracleRequest') {
        console.log(`\n\nOracle Requested: index: ${result.args.index.toNumber()}, airline: ${result.args.airline}, flight:  ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}`);
      } else if (result.event === 'FlightStatusInfo') {
        console.log(`\n\nFlight Status Available: airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}, status: ${result.args.status.toNumber()}`);
      } else if (result.event === 'OracleReport') {
        console.log(`\n\nOracle Report Available: airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}, status: ${result.args.status.toNumber()}`);
      }*/
    });


    let eventsApp = config.flightSuretyApp.allEvents();
    eventsApp.watch((error, result) => {
      /*if (result.event === 'StatusChange') {
        console.log(`\n\nStatusChange: newStatus: ${result.args.newStatus}, votesNum:  ${result.args.votesNum.toNumber()}}`);
      } else if (result.event === 'AirlineRegistered') {
        console.log(`\n\AirlineRegistered: airline: ${result.args.airline}, votesNum:  ${result.args.votesNum.toNumber()}}`);
      } else if (result.event === 'AirlineActivated') {
        console.log(`\n\nAirlineActivated: airline: ${result.args.airline}, existingFund: ${result.args.existingFund.toNumber()}}`);
      } else */if (result.event === 'OracleRequest') {
        console.log(`\n\n FSA: Oracle Requested: index: ${result.args.index.toNumber()}, airline: ${result.args.airline}, flight:  ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}`);
      } else if (result.event === 'FlightStatusInfo') {
        console.log(`\n\n FSA: Flight Status Available: airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}, status: ${result.args.status.toNumber()}`);
      } else if (result.event === 'OracleReport') {
        console.log(`\n\n FSA: Oracle Report Available: airline: ${result.args.airline}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp.toNumber()}, status: ${result.args.status.toNumber()}`);
      }
    });
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/


  it('First airline can send funds', async () => {
    
    await config.flightSuretyApp.fund({value: web3.toWei("10", "ether"), from: config.firstAirline});
    assert.equal(await config.flightSuretyData.isFunded.call(config.firstAirline), true, "Airline should be funded!");

  });

  it('First airline is registered and funded and authorized', async () => {
    
    assert.equal(await config.flightSuretyData.isAirline.call(config.firstAirline), true, "Airline should be registered!");
    assert.equal(await config.flightSuretyData.isFunded.call(config.firstAirline), true, "Airline should be funded!");

    //await config.flightSuretyData.authorizeCaller(config.firstAirline);
    assert.equal(await config.flightSuretyData.isAuthorized.call(config.firstAirline), true, "Airline should be Authorized!");

  });

  it('Only 1 active airline', async () => {
    assert.equal(await config.flightSuretyData.getActiveAirlines.call(), 1, "Airline count should be 1!");
  });


  

  /*it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Funded Airline (only 1 registered)`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.firstAirline });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      await config.flightSuretyData.setOperatingStatus(true, { from: config.firstAirline });
      
  });*/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it('First airline is funded', async () => {
    
    assert.equal(await config.flightSuretyData.isFunded.call(config.firstAirline, {from: config.firstAirline}), true, "Airline should be funded!");

  });

  
  it('(first airline) can register an Airline using registerAirline() but not funded yet', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        let r = await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        //await config.flightSuretyData.fund({value: web3.toWei("10", "ether"), from: newAirline});
        //console.log(r[0],r[1]);
    }
    catch(e) {
        console.log(e);
    }
    let result = await config.flightSuretyData.isFunded.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline), true, "Airline should be registered!");

  });

  /*it('(new airline) cannot register an Airline before it is funded', async () => {
    
    // ARRANGE
    let newAirline1 = accounts[2];
    let newAirline2 = accounts[3];
    let reverted = false;

    await config.flightSuretyApp.registerAirline(newAirline2, {from: newAirline1});

    // ASSERT
    assert.equal(await config.flightSuretyData.isFunded.call(newAirline2), false, "Airline should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline2), false, "Airline should not be registered!");
  });*/

  it('(new airline) can send funds and change status to isFunded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.fund({value: web3.toWei("10", "ether"), from: newAirline});
    }
    catch(e) {
        console.log(e);
    }
    let result = await config.flightSuretyData.isFunded.call(newAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should be funded!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline), true, "Airline should be registered!");

  });

  it('(new airline) can register an Airline after it is funded', async () => {
    
    // ARRANGE
    let newAirline1 = accounts[2];
    let newAirline2 = accounts[3];
    let newAirline3 = accounts[4];

    // ACT
    try {
        let r = await config.flightSuretyApp.registerAirline(newAirline2, {from: newAirline1});
    }
    catch(e) {
        console.log(e);
    }
    let result1 = await config.flightSuretyData.isFunded.call(newAirline2); 

    // ASSERT
    assert.equal(result1, false, "Airline 2 should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline2), true, "Airline 2 should be registered!");

    await config.flightSuretyApp.fund({value: web3.toWei("10", "ether"), from: newAirline2});
    assert.equal(await config.flightSuretyData.isFunded.call(newAirline2), true, "Airline 2 should be funded!");

    // ACT
    try {
      let r = await config.flightSuretyApp.registerAirline(newAirline3, {from: newAirline1});
  }
  catch(e) {
      console.log(e);
  }
  let result2 = await config.flightSuretyData.isFunded.call(newAirline3); 

  // ASSERT
  assert.equal(result2, false, "Airline 3 should not be funded yet!");
  assert.equal(await config.flightSuretyData.isAirline.call(newAirline3), true, "Airline 3 should be registered!");

  await config.flightSuretyApp.fund({value: web3.toWei("10", "ether"), from: newAirline3});
  assert.equal(await config.flightSuretyData.isFunded.call(newAirline3), true, "Airline 3 should be funded!");

  });


  it('(new airline) can only be registered by multi consensus now', async () => {
    
    // ARRANGE
    let Airline2 = accounts[2];
    let Airline3 = accounts[3];
    let newAirline = accounts[5];

    // ACT
    try {
        let r = await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
        console.log(e);
    }

    // ASSERT
    assert.equal(await config.flightSuretyData.isFunded.call(newAirline), false, "Airline should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline), false, "Airline should not be registered yet!");

  });

  it('Duplicate votes not counted', async () => {
    
    // ARRANGE
    let newAirline = accounts[5];
    let reverted = false;

    // ACT
    try {
        let r = await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
      reverted = true;
        //console.log(e);
    }

    // ASSERT
    assert.equal(reverted, true, "Duplicates are not ignored!"); 
    assert.equal(await config.flightSuretyData.isFunded.call(newAirline), false, "Airline should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline), false, "Airline should not be registered yet!");

  });

  it('(new airline) can be registered by multi consensus now, second vote makes it registered', async () => {
    
    // ARRANGE
    let Airline2 = accounts[2];
    let newAirline = accounts[5];

    // ACT
    try {
        let r = await config.flightSuretyApp.registerAirline(newAirline, {from: Airline2});
    }
    catch(e) {
        console.log(e);
    }

    // ASSERT
    assert.equal(await config.flightSuretyData.isFunded.call(newAirline), false, "Airline should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline), true, "Airline should be registered now!");

  });

  it('can register flight', async () => {
    
    // ARRANGE
    let airline = accounts[2];
    let flight = 'ND1309'; // Course number
    //let timestamp = Math.floor(Date.now() / 1000)+10000;

    // ACT
    await config.flightSuretyApp.registerFlight(airline, flight, config.fixedtimestamp, {from: airline});
    var event1 = config.flightSuretyData.FlightRegistered();
    await event1.watch((err, res) => {
      console.log(`\n\nFlight Registered: airline: ${res.args.airline}, flight: ${res.args.flight}, timestamp: ${res.args.timestamp.toNumber()}`);
    });
    assert.equal(await config.flightSuretyData.isFlightRegistered.call(airline, flight, config.fixedtimestamp), true, "Flight should be registered now!");
    
  });

  it('can buy insurance', async () => {
    
    // ARRANGE
    let passenger = accounts[30];
    let airline = accounts[2];
    let flight = 'ND1309'; // Course number
    //let timestamp = Math.floor(Date.now() / 1000)+10000;

    // ACT
    //let balanceBefore = await web3.eth.getBalance(passenger);
    //console.log("Balance before = ", balanceBefore);
    assert.equal(await config.flightSuretyData.isFlightRegistered.call(airline, flight, config.fixedtimestamp), true, "Flight should be registered now!");
    await config.flightSuretyApp.buy(airline, flight, config.fixedtimestamp, {value: web3.toWei("1", "ether"), from: passenger});
    var event = config.flightSuretyData.InsuranceBought();
    await event.watch((err, res) => {
      console.log(`\n\nInsurance Bought: caller: ${res.args.caller}, amount: ${res.args.amount.toNumber()}, airline: ${res.args.airline}, flight:  ${res.args.flight}, timestamp: ${res.args.timestamp.toNumber()}`);
    });

    //let balanceAfter = await web3.eth.getBalance(passenger);
    //console.log("Balance after = ", balanceAfter);
    
  });

  it('can withdraw refund', async () => {
    
    // ARRANGE
    let passenger = accounts[30];
    let airline = accounts[2];
    let flight = 'ND1309'; // Course number
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=10; a<TEST_ORACLES_COUNT+10; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }

    // Submit a request for oracles to get status information for a flight
    let r = await config.flightSuretyApp.fetchFlightStatus(airline, flight, config.fixedtimestamp);
    // Watch the emitted event Harvested()
    var event = config.flightSuretyApp.OracleRequest();
    await event.watch((err, res) => {
      console.log(`\n\nOracle Requested: index: ${res.args.index.toNumber()}, airline: ${res.args.airline}, flight:  ${res.args.flight}, timestamp: ${res.args.timestamp.toNumber()}`);
    });

    for(let a=10; a<TEST_ORACLES_COUNT+10; a++) {
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



    //let balanceBefore = await web3.eth.getBalance(passenger);
    //console.log("Balance before = ", balanceBefore);
    await config.flightSuretyApp.withdraw({from: passenger});
    var event = config.flightSuretyData.PassengerPaid();
    await event.watch((err, result) => {
      console.log(`\n\n FSD: Passenger Paid: passenger: ${result.args.passenger}, amount: ${result.args.amount.toNumber()}`);
    });
    //let balanceAfter = await web3.eth.getBalance(passenger);
    //console.log("Balance after = ", balanceAfter);
    
  });

  /*
  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    
      let reverted = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.firstAirline });
          await config.flightSurety.setTestingMode(true);
          
      }
      catch(e) {
          console.log("Here!");
          reverted = true;
          assert.equal(reverted, true, "Access not blocked for requireIsOperational");  
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  /*it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });*/
 

});
