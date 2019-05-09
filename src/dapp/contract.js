import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.firstAirline = null;
        this.airlines = [];
        this.passengers = [];
        this.appAddress = config.appAddress;
        this.flights = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.flights.push({ airline: '0xf17f52151EbEF6C7334FAD080c5704D77216b732', flight: 'ND139', timestamp: 2557369118 });
            this.flights.push({ airline: '0xf17f52151EbEF6C7334FAD080c5704D77216b732', flight: 'EK314', timestamp: 2557369118 });
            this.flights.push({ airline: '0xf17f52151EbEF6C7334FAD080c5704D77216b732', flight: 'SA557', timestamp: 2557369118 });
            this.flights.push({ airline: '0xf17f52151EbEF6C7334FAD080c5704D77216b732', flight: 'ET345', timestamp: 2557369118 });
            this.owner = accts[0];
            this.firstAirline = accts[1];
            let self = this;
            self.flightSuretyData.methods
                .authorizeCaller(this.appAddress)
                .send({ from: self.owner }, (error, result) => {
                    self.flightSuretyApp.methods
                        .isFunded()
                        .call({ from: this.firstAirline }, (error, result) => {
                            if(!result){
                            self.flightSuretyApp.methods
                                .fund()
                                .send({ from: this.firstAirline, value: web3.toWei("10", "ether") }, (error, result) => {
                                    console.log('Fund', result, error);
                                    for (let i = 0; i < 4; i++) {
                                        console.log(this.flights[i].airline, this.flights[i].flight, this.flights[i].timestamp);
                                        self.flightSuretyApp.methods
                                            .registerFlight(self.flights[i].airline, self.flights[i].flight, self.flights[i].timestamp)
                                            .send({ from: self.owner, gas:3000000 }, (error, result) => {
                                                console.log(i, error);
                                            });
                                    }

                                });

                            }
                        });
                });




            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.flights[flight].airline,
            flight: self.flights[flight].flight,
            timestamp: self.flights[flight].timestamp
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

    registerAirline(airline, callback) {
        let self = this;
        let payload = {
            caller: self.airlines[0],
            airline: airline,
            //timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .registerAirline(payload.airline)
            .send({ from: payload.caller }, (error, result) => {
                console.log(result, error);
                callback(error, result);
            });
    }

    fundAirline(airline, callback) {
        let self = this;
        let payload = {
            caller: self.airlines[0],
            airline: airline,
            //timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fund()
            .send({ from: payload.airline, value: web3.toWei("10", "ether") }, (error, result) => {
                console.log(result, error);
                callback(error, result);
            });
    }

    buyInsurance(flight, passenger, callback) {
        let self = this;
        let payload = {
            caller: self.airlines[0],
            airline: self.flights[flight].airline,
            flight: self.flights[flight].flight,
            timestamp: self.flights[flight].timestamp,
            passenger: passenger
        }
        self.flightSuretyApp.methods
            .buy(payload.airline, payload.flight, payload.timestamp)
            .send({ from: payload.passenger, value: web3.toWei("1", "ether"), gas:3000000 }, (error, result) => {
                console.log(result, error);
                callback(error, result);
            });
    }

    withdraw(passenger, callback) {
        let self = this;
        let payload = {
            caller: self.airlines[0],
            passenger: passenger
        }
        self.flightSuretyApp.methods
            .withdraw()
            .send({ from: payload.passenger, gas:3000000 }, (error, result) => {
                console.log(result, error);
                callback(error, result);
            });
    }
}