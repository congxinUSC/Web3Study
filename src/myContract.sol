pragma solidity ^0.4.19;

contract myContract {

    string message;

    function myContract() public {
        message = "Hi!";
    }

    function myRead() public constant returns(string) {
        return message;
    }

    function myWrite(string _message) public {
        message = _message;
    }
}
