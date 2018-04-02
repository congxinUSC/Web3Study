pragma solidity ^0.4.21;

// the contract definition is like a class definition in c++
contract MedRecord {

    struct User {
        string RSApubKey;
        uint[] recordIndices;
        uint8 role; // bitset, 1 as patient, 10 as doctor, 11 as both
    }

    mapping(address => User) userList;

    // the actual storage of the records
    string[1000000] records;
    uint recordCount;

    mapping(address => mapping(address => bool)) rights;// patient -> doctor

    event opDone(bool indexed _isSet);

    modifier needAuthentication(address _target) {
        //require(rights[_target][msg.sender]);
        //_;
        if(rights[_target][msg.sender]) {
            _;
            emit opDone(true);
        } else {
            revert();
            emit opDone(false);
        }
    }

    modifier needDoctor(address _target) {
        //require((userList[_target].role | 0xFD) == 0xFF);
        //_;
        if((userList[_target].role | 0xFD) == 0xFF) {
            _;
            emit opDone(true);
        } else {
            revert();
            emit opDone(false);
        }
    }

    // like classes smart contract has a constructor, this is called when an instance of the contract is deployed
    function MedRecord(string _pubKey) public {
        // initializing code
        recordCount = 0;
        registerWithKey(_pubKey);
    }

    // this is a constant (view) function, which means it doesn't change the state of the contract.
    // constant function call doesn't need any synchronization so no mining process is needed for it.
    function readRecordOf(address _target, uint _id) public view returns(string) {
        uint[] storage _indices = userList[_target].recordIndices;
        if(_id > _indices.length) {
            return '';
        } else {
            return records[_indices[_indices.length-_id]];
        }
    }

    // this function changes the state of the contract, note that if you want to return something from it, use events
    function setRecord(address _target, string _record) public needAuthentication(_target) {
        User storage _usr = userList[_target];
        _usr.recordIndices.push(recordCount);
        records[recordCount] = _record;
        recordCount++;
        rights[_target][msg.sender] = false;
    }

    function getPubKey(address _target) public view returns (string) {
        return userList[_target].RSApubKey;
    }

    function registerWithKey(string _pubKey) public {
        userList[msg.sender].RSApubKey = _pubKey;
        userList[msg.sender].role |= 1;
    }

    function becomeDoctor(address _agency) public {
        AuthorizingAgency _aa = AuthorizingAgency(_agency);
        if(_aa.isQualified(msg.sender)) {
            userList[msg.sender].role |= 2;
            emit opDone(true);
        } else {
            emit opDone(false);
        }
    }

    function assignConsulation(address _doctor) public needDoctor(_doctor) {
        rights[msg.sender][_doctor] = true;
    }
}

contract AuthorizingAgency {

    function isQualified(address _applicant) external pure returns(bool);

}
