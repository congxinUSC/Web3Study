import Web3 from 'web3';
import fs from 'fs';
import solc from 'solc';

// we use testrpc as our provider
let provider = new Web3.providers.HttpProvider("http://localhost:8545");
let web3 = new Web3(provider);

// read the contract source code from file or whatever
let contractCode = fs.readFileSync('contracts/AuthorizingAgency.sol').toString();
let compiledContractCode = solc.compile(contractCode);
// create the contract object
let abiDefinition = JSON.parse(compiledContractCode.contracts[':AuthorizingAgency'].interface);
let byteCode = compiledContractCode.contracts[':AuthorizingAgency'].bytecode;

web3.eth.getAccounts().then(accounts => {
  let accountAddress = accounts[0];

  let MedRecord = new web3.eth.Contract(abiDefinition);
  MedRecord.deploy(({data: byteCode, arguments: []})).send({
    from: accountAddress,
    gas: '1500000'
  }).on('error', (err) => {
    console.log(err);
  }).then((instance) => {
    // console.log(contractInstance); // too long, only log when needed
    console.log('Authorizing agency deployed at address:');
    console.log(instance.options.address);
  });
});