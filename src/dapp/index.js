
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('register-airline').addEventListener('click', () => {
            let airline = DOM.elid('airline-address').value;
            // Write transaction
            contract.registerAirline(airline, (error, result) => {
                display('airlines', 'Register Airline', [ { label: 'Airline Registered', value: error? 'Failed '+error:'Success'} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('fund-airline').addEventListener('click', () => {
            let airline = DOM.elid('airline-address2').value;
            // Write transaction
            contract.fundAirline(airline, (error, result) => {
                display('airlines', 'Fund Airline', [ { label: 'Airline Funded', value: error? 'Failed '+error:'Success'} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-number1').value;
            let passenger = DOM.elid('passenger-address').value;
            // Write transaction
            contract.buyInsurance(flight, passenger, (error, result) => {
                display('Passenger', 'Buy Insurance', [ { label: 'Insurance Bought', value: error? 'Failed '+error:'Success'} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('withdraw-refunds').addEventListener('click', () => {
            let passenger = DOM.elid('passenger-address1').value;
            // Write transaction
            contract.withdraw(passenger, (error, result) => {
                display('Passenger', 'Withdraw Refunds', [ { label: 'Refunds Withdrawn', value: error? 'Failed '+error:'Success'} ]);
            });
        })
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







