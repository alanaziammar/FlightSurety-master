
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from: config.owner});
    await config.flightSuretyData.authorizeCaller(config.firstAirline, {from: config.owner});
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it('First airline is registered and funded and authorized', async () => {
    
    assert.equal(await config.flightSuretyData.isAirline.call(config.firstAirline), true, "Airline should be registered!");
    assert.equal(await config.flightSuretyData.isFunded.call(config.firstAirline), true, "Airline should be funded!");

    //await config.flightSuretyData.authorizeCaller(config.firstAirline);
    //assert.equal(await config.flightSuretyData.isAuthorized.call(config.firstAirline), true, "Airline should be Authorized!");

  });

  it('Only 1 active airline', async () => {
    assert.equal(await config.flightSuretyData.getActiveAirlines.call(), BigNumber(1), "Airline count should be 1!");
  });


  

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

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

  it(`(multiparty) can allow access to setOperatingStatus() for Funded Aireline (only 1 registered)`, async function () {

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
      
  });

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  /*
  it('(airline) can register an Airline using registerAirline() but not funded yet', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        let r = await config.flightSuretyApp.registerAirline.call(newAirline, {from: config.firstAirline});
        console.log(r[0],r2[1]);
    }
    catch(e) {
        console.log(e);
    }
    let result = await config.flightSuretyData.isFunded.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be funded yet!");
    assert.equal(await config.flightSuretyData.isAirline.call(newAirline), true, "Airline should be registered!");

  });

  /*it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    
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

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
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
