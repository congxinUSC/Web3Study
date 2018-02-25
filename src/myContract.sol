pragma solidity ^0.4.19;

// the contract definition is like a class definition in c++
contract myContract {

    // a table of the rsa public keys that makes it easy to send encrypted records
    mapping(address => string) RSAPubKeys;
    // tells the ownership of the records
    mapping(address => uint[]) recordIndices;
    // the actual storage of the records
    string[1000000] records;
    uint recordCount;

    event newRecord(uint indexed _i);


    // like classes smart contract has a constructor, this is called when an instance of the contract is deployed
    function myContract(string _pubKey) public {
        // initializing code
        recordCount = 0;
        RSAPubKeys[msg.sender] = _pubKey;
    }

    // this is a constant function, which means it doesn't change the state of the contract.
    // constant function call doesn't need any synchronization so no mining process is needed for it.
    function readRecordOf(address _target, uint _id) public constant returns(string) {
        uint[] storage _indices = recordIndices[_target];
        if(_id >= _indices.length) {
            return '';
        } else {
            return records[_indices[_id]];
        }
    }

    // this function changes the state of the contract, note that if you want to return something from it, use events
    function setRecord(address _target, string _record) public {
        recordIndices[_target].push(recordCount);
        records[recordCount] = _record;
        recordCount++;
        newRecord(recordCount);
    }

    function getPubKey(address _target) public constant returns (string) {
        return RSAPubKeys[_target];
    }

    function setPubKey(string _pubKey) public {
        RSAPubKeys[msg.sender] = _pubKey;
    }
}


