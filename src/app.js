import express from 'express';
import Web3 from 'web3';
import fs from 'fs';
import solc from 'solc';
import bodyParser from 'body-parser';

let provider = new Web3.providers.HttpProvider("http://localhost:8545");
let web3 = new Web3(provider);

// read the contract source code from file or whatever
let contractCode = fs.readFileSync('src/myContract.sol').toString();
let compiledContractCode = solc.compile(contractCode);
// create the contract object
let abiDefinition = JSON.parse(compiledContractCode.contracts[':myContract'].interface);
let byteCode = compiledContractCode.contracts[':myContract'].bytecode;

let accountAddress = null;
let myContract = null;
let contractInstance = null;
let app = express();
let api = express.Router();

app.use(bodyParser.json());

// Avoid cross-domain problem in further test
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept");
  next();
});

api.post('/connect', (req,res) => {
  let contractAddress = req.body['address'];
  contractInstance = new web3.eth.Contract(abiDefinition, contractAddress);
  res.send('ok!');
});

api.post('/login', (req, res) => {
  let privateKey = '0x' + req.body['privateKey'];
  accountAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
  res.send(accountAddress);
});

api.get('/deploy', (req,res) => {
  myContract = new web3.eth.Contract(abiDefinition);
  myContract.deploy(({data: byteCode, arguments:[]})).send({
    from: accountAddress,
    gas: '1500000'
  }).on('error', (err) => {
    console.log(err);
    res.send('error!');
  }).then((instance) => {
    contractInstance = instance;
    contractInstance.setProvider(provider);
    console.log(contractInstance);
    console.log(contractInstance.options.address);
    res.send(contractInstance.options.address);
  });
});


api.post('/write', (req, res) => {
  let content = req.body['content'];
  // let target = req.body['address'];

  contractInstance.methods.myWrite(content).send({
    from: accountAddress,
    gas: '1500000'
  }).on('transactionHash', (hash) => {
    console.log('hash: ' + hash);
  }).on('confirmation', (confirmationNumber, receipt) => {
    console.log('confirmationNumber: ' + confirmationNumber);
    console.log('receipt: ' + receipt);
    res.json(receipt.events);
  }).on('error', console.error);
});

api.get('/read', (req, res) => {
  contractInstance.methods.myRead().call(
  ).then((record) => {
    res.send(record);
  });
});

app.use('/api', api);

let server = app.listen(process.env.NODE_PORT, () => {
  let host = server.address().address;
  let port = server.address().port;
  console.log('Node listening at http://%s:%s', host, port);
});
