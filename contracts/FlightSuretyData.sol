pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 existingFund;
    }

    mapping(address => bool) private authorizedContracts;
    mapping(address => Airline) private airlines;
    uint256 activeAirlines;
    address[] multiCalls = new address[](0);
    address[] airlineVotes = new address[](0);
    uint constant M = 2;

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
        activeAirlines = 1;
        airlines[firstAirline] = Airline({isRegistered: true, isFunded: false, existingFund: 0 ether});
    }

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
                                address airline    
                            )
                            external
                            requireIsFunded
                            requireIsCallerAuthorized
                            requireIsOperational
                            returns(bool success, uint256 votes)
    {
        //require(isAirline(msg.sender), "Caller is not funded.");
        require(!airlines[airline].isRegistered, "Airline is already registered.");
        if(activeAirlines<4){
            airlines[airline] = Airline({isRegistered: true, isFunded: false, existingFund: 0 ether});
            return (true, uint256(1));
        }
        else{
            bool isDuplicate = false;
            for(uint c=0; c<airlineVotes.length; c++) {
                if (airlineVotes[c] == msg.sender) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Caller has already called this function.");

            airlineVotes.push(msg.sender);

            if (airlineVotes.length >= activeAirlines.div(2)) {
                airlines[airline] = Airline({isRegistered: true, isFunded: false, existingFund: 0 ether});
                uint256 _votes = uint256(airlineVotes.length);   
                airlineVotes = new address[](0);
                return (true, _votes);   
            }
            else{
                return (false, uint256(airlineVotes.length));  
            }
        }
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (                             
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
    {
        require(airlines[msg.sender].isRegistered, "Airline is not registered.");
        airlines[msg.sender].existingFund = airlines[msg.sender].existingFund + msg.value;
        if(airlines[msg.sender].existingFund>=10 ether){
            airlines[msg.sender].isFunded = true;
        }

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
        fund();
    }


}

