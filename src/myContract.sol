pragma solidity ^0.4.19;

// the contract definition is like a class definition in c++
contract myContract {

    // just some simple value in the storage, by default they are private
    string message;

    // like classes smart contract has a constructor, this is called when an instance of the contract is deployed
    function myContract() public {
        message = "Hi!";
    }

    // this is a constant function, which means it doesn't change the state of the contract.
    // constant function call doesn't need any synchronization so no mining process is needed for it.
    function myRead() public constant returns(string) {
        return message;
    }

    // this function changes the state of the contract, note that if you want to return something from it, use events
    function myWrite(string _message) public {
        message = _message;
    }
}
