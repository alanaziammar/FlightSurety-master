pragma solidity ^0.4.24;

/**
 * @title FlightLib
 * @dev Library for managing addresses assigned to a Role.
 */
library FlightLib {

  struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        string flight;
        mapping(address => Insurance) insurees;
        address[] insureesAddresses;
    }

    struct Insurance {
        uint256 amount;        
        uint256 credit;
        bool isCredited;
    }
}