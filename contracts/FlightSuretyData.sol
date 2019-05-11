pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;



    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    uint256 private enabled;
    uint256 private counter;
    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 existingFund;
    }

    struct Insurance {
        //address passenger;
        uint256 amount;        
        uint256 credit;
        bool isCredited;
    }

    mapping(address => bool) private authorizedContracts;
    mapping(address => Airline) private airlines;
    uint256 activeAirlines;
    address[] multiCalls = new address[](0);
    address[] airlineVotes = new address[](0);
    uint constant M = 2;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        string flight;
        mapping(address => Insurance) insurees;
        address[] insureesAddresses;
    }
    mapping(bytes32 => Flight) private flights;
    mapping(address => bytes32[]) private allRefunds;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirline
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        authorizedContracts[firstAirline] = true;
        activeAirlines = 0;
        airlines[firstAirline] = Airline({isRegistered: true, isFunded: false, existingFund: 0 ether});
        enabled = block.timestamp;
        counter = 1;
    }


    event StatusChange(bool newStatus, uint256 votesNum);

    event AirlineRegistered(address airline, uint256 votesNum);

    event AirlineActivated(address airline, uint256 existingFund);

    event FlightRegistered(address airline, string flight, uint256 timestamp);

    event InsuranceBought(address caller, uint256 amount, address airline, string flight, uint256 timestamp);

    event InsureesCredited(uint arrayLength, address airline, string flight, uint256 timestamp);

    event PassengerPaid(address passenger, uint256 amount);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    modifier requireIsFunded()
    {
        require(airlines[msg.sender].isFunded, "Airline is currently not funded");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized()
    {
        require(authorizedContracts[msg.sender], "Caller is not authorized");
        _;
    }

    modifier rateLimit(uint time)
    {
        require(block.timestamp>=enabled, "Rate Limiting is in effect");
        enabled = enabled.add(time);
        _;
    }

    modifier entrancyGuard(){
        counter = counter.add(1);
        uint256 guard = counter;
        _;
        require(guard == counter,"Re-entrancy is not allowed.");
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool)
    {
        return operational;
    }

    function getActiveAirlines() 
                            public 
                            view 
                            returns(uint256)
    {
        return activeAirlines;
    }

    function isAirline(address airline) 
                            public 
                            view 
                            returns(bool)
    {
        return airlines[airline].isRegistered;
    }

    function isFunded(address airline) 
                            public 
                            view 
                            returns(bool)
    {
        return airlines[airline].isFunded;
    }

    function isAuthorized(address airline) 
                            public 
                            view 
                            returns(bool)
    {
        return authorizedContracts[airline];
    }

    function isFlightRegistered(address airline, string flight, uint256 timestamp) 
                            public 
                            view 
                            returns(bool)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        return flights[flightKey].isRegistered;
    }

    


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                                (
                                    bool mode
                                )
                                external
                                requireIsFunded
                                
    {
        require(mode != operational, "New mode must be different from existing mode");

        bool isDuplicate = false;
        for(uint c=0; c<multiCalls.length; c++) {
            if (multiCalls[c] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Caller has already called this function.");

        multiCalls.push(msg.sender);
        uint threshold = 1;
        if(activeAirlines>4){
            threshold = M;
        }

        if (multiCalls.length >= threshold) {
            operational = mode;      
            emit StatusChange(operational, multiCalls.length);
            multiCalls = new address[](0);     
        }
    }

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    function deauthorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    /*function getFlightDetails
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                external
                                requireIsCallerAuthorized
                                requireIsOperational
                                returns(Flight flightDetails)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flights[flightKey].isRegistered, "Flight is not registered.");
        return flights[flightKey];
    }*/
    

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            ( 
                                address airline,
                                address caller,
                                uint256 _votes  
                            )
                            external
                            //requireIsFunded  already checked at the app contract
                            requireIsCallerAuthorized
                            requireIsOperational
                            returns(bool success, uint256 votes)
    {
        airlines[airline] = Airline({isRegistered: true, isFunded: false, existingFund: 0 ether});
        emit AirlineRegistered(airline, _votes);
        return (true, _votes);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (
                                address caller,
                                address airline,
                                string flight,
                                uint256 timestamp                        
                            )
                            external
                            payable
                            requireIsCallerAuthorized
                            requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flights[flightKey].isRegistered, "Flight is not registered.");
        require(block.timestamp<=timestamp, "Flight have already passed.");
        require(flights[flightKey].statusCode == STATUS_CODE_UNKNOWN, "Flight status is already known.");
        require(flights[flightKey].insurees[caller].amount <= 0, "Already bought insurance.");
        require(msg.value<=1 ether, "Cannot insure for more than 1 ether");
        flights[flightKey].insurees[caller] = Insurance({amount: msg.value, credit: 0, isCredited: false});
        flights[flightKey].insureesAddresses.push(caller);
        emit InsuranceBought(caller, msg.value, airline, flight, timestamp);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp,
                                    uint256 percentage
                                )
                                external
                                requireIsCallerAuthorized
                                requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flights[flightKey].isRegistered, "Flight is not registered.");

        uint arrayLength = flights[flightKey].insureesAddresses.length;
        for (uint i=0; i<arrayLength; i++) {
            address passenger = flights[flightKey].insureesAddresses[i];
            if(flights[flightKey].insurees[passenger].amount > 0 &&
            !flights[flightKey].insurees[passenger].isCredited){
                flights[flightKey].insurees[passenger].credit = flights[flightKey].insurees[passenger].amount.mul(percentage).div(100);
                flights[flightKey].insurees[passenger].isCredited = true;
                allRefunds[passenger].push(flightKey);
            }
        }
        emit InsureesCredited(arrayLength, airline, flight, timestamp);
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address passenger
                            )
                            external
                            requireIsCallerAuthorized
                            requireIsOperational
                            rateLimit(1 minutes)
                            entrancyGuard()
    {
        uint arrayLength = allRefunds[passenger].length;
        uint256 totalRefund = 0;
        for (uint i=0; i<arrayLength; i++) {
            totalRefund = totalRefund.add(flights[allRefunds[passenger][i]].insurees[passenger].credit);
            flights[allRefunds[passenger][i]].insurees[passenger].credit = 0;
        }
        delete allRefunds[passenger];
        require(totalRefund>0, 'No money to refund');

        passenger.transfer(totalRefund);
        emit PassengerPaid(passenger, totalRefund);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            ( 
                                address caller  
                            )
                            public
                            payable
                            requireIsCallerAuthorized
                            requireIsOperational
    {
        airlines[caller].existingFund = airlines[caller].existingFund.add(msg.value);
        if(!airlines[caller].isFunded){
            airlines[caller].isFunded = true;
            activeAirlines = activeAirlines.add(1);
            emit AirlineActivated(caller, airlines[caller].existingFund);
        }
    }

    /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                    address _airline,
                                    string _flight,
                                    uint256 _timestamp
                                )
                                external
                                requireIsCallerAuthorized
                                requireIsOperational
    {
        bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
        require(!flights[flightKey].isRegistered, "Flight is already registered.");
        flights[flightKey] = Flight({
                                        isRegistered: true,
                                        updatedTimestamp: _timestamp,
                                        airline: _airline,
                                        flight: _flight,
                                        statusCode: STATUS_CODE_UNKNOWN,
                                        insureesAddresses: new address[](0)
                                    });
        emit FlightRegistered(_airline, _flight, _timestamp);               
    }

    function updateFlightStatus
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                external
                                requireIsCallerAuthorized
                                requireIsOperational
    {
        // Save the flight information for posterity
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flights[flightKey].statusCode != statusCode, "New status must be different from existing status");
        flights[flightKey].statusCode = statusCode;
    }

    // Query the status of any flight
    function viewFlightStatus
                            (
                                address airline,
                                string flight,
                                uint256 timestamp
                            )
                            external
                            view
                            returns(uint8)
    {
            bytes32 flightKey = getFlightKey(airline, flight, timestamp);
            //require(flights[flightKey].hasStatus, "Flight status not available");
            return flights[flightKey].statusCode;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund(msg.sender);
    }


}

