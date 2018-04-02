pragma solidity ^0.4.21;

contract AuthorizingAgency {

    function isQualified(address _applicant) external pure returns(bool) {
        return int(_applicant) % 2 == 0;
    }

}