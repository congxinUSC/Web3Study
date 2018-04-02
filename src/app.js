import express from 'express';
import Web3 from 'web3';
import fs from 'fs';
import solc from 'solc';
import bodyParser from 'body-parser';
import cryptico from 'cryptico';

// we use testrpc as our provider
let provider = new Web3.providers.HttpProvider("http://localhost:8545");
let web3 = new Web3(provider);

// read the contract source code from file or whatever
let contractCode = fs.readFileSync('contracts/MedRecord.sol').toString();
let compiledContractCode = solc.compile(contractCode);
// create the contract object
let abiDefinition = JSON.parse(compiledContractCode.contracts[':MedRecord'].interface);
let byteCode = compiledContractCode.contracts[':MedRecord'].bytecode;

let accountAddress = null;
let MedRecord = null;
let contractInstance = null;

let rsaPrivateKey = null;
let rsaPublicKey = null;

// set up an express server
let app = express();
let api = express.Router();

// use body-parser to get the request body
app.use(bodyParser.json());

// Avoid cross-domain problem in further test
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept");
  next();
});

// connect to an existing smart contract instance
api.post('/connect', (req,res) => {
  let contractAddress = req.body['address'];
  contractInstance = new web3.eth.Contract(abiDefinition, contractAddress);

  contractInstance.methods.registerWithKey(rsaPublicKey).send({
    from: accountAddress,
    gas: '1500000'
  }).on('transactionHash', (hash) => {
    console.log('hash: ' + hash);
  }).on('confirmation', (confirmationNumber, receipt) => {
    console.log('confirmationNumber: ' + confirmationNumber);
    // console.log('receipt: ' + receipt); // too long, only log when needed
    res.send('ok!');
  }).on('error', (error) => {
    console.log(error);
    res.send('error!');
  });

});


// this process is simulating logging in an account with the private key, later on it will contain code that unlocks the account
api.post('/login', (req, res) => {
  let privateKey = '0x' + req.body['privateKey'];
  accountAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
  rsaPrivateKey = cryptico.generateRSAKey(privateKey, 1024);
  rsaPublicKey = cryptico.publicKeyString(rsaPrivateKey);
  res.send(accountAddress);
});

// deploy a smart contract into the blockchain and get it's address
api.get('/deploy', (req,res) => {
  MedRecord = new web3.eth.Contract(abiDefinition);
  MedRecord.deploy(({data: byteCode, arguments:[rsaPublicKey]})).send({
    from: accountAddress,
    gas: '1500000'
  }).on('error', (err) => {
    console.log(err);
    res.send('error!');
  }).then((instance) => {
    contractInstance = instance;
    // console.log(contractInstance); // too long, only log when needed
    console.log(contractInstance.options.address);
    res.send(contractInstance.options.address);
  });
});

// write some content into the smart contract storage
api.post('/write', (req, res) => {
  let content = req.body['content'];
  let target = req.body['address'];

  contractInstance.methods.getPubKey(target).call(
  ).then((pubKey) => {
    console.log('pubKey: ' + pubKey);

    let encrypted = cryptico.encrypt(content, pubKey);

    // console.log(encrypted.cipher);

    // use 'send' for non constant functions
    contractInstance.methods.setRecord(target, encrypted.cipher).send({
      from: accountAddress,
      gas: '1500000'
    }).on('transactionHash', (hash) => {
      // console.log('hash: ' + hash);
    }).on('confirmation', (confirmationNumber, receipt) => {
      // console.log('confirmationNumber: ' + confirmationNumber);
      // console.log('receipt: ' + receipt);
      res.json(receipt.events);
    }).on('error', (error) => {
      console.log(error);
      res.send('error!');
    });
  });
});


// read some content from the smart contract storage
api.post('/read', (req, res) => {
  let retObj = [];
  let target = req.body['address'];
  let amount = req.body['amount'];

  // read all records of the target recursively
  let helper = (i) => {
    if (i <= 0) {
      res.send(retObj);
    } else {
      contractInstance.methods.readRecordOf(target, i).call(
      ).then((encrypted) => {
        if (encrypted !== '') {
          let record = cryptico.decrypt(encrypted, rsaPrivateKey);
          retObj.push({
            'id': i,
            'record': record
          });
          // console.log(i);
        }
        helper(i - 1);
      });
    }
  };

  helper(amount);
});

api.post('/becomeDoctor', (req, res) => {
  let agency = req.body['agency'];
  contractInstance.methods.becomeDoctor(agency).send({
      from: accountAddress,
      gas: '1500000'
    }
  ).on('transactionHash', (hash) => {
    // console.log('hash: ' + hash);
  }).on('confirmation', (confirmationNumber, receipt) => {
    // console.log('confirmationNumber: ' + confirmationNumber);
    // console.log('receipt: ' + receipt);
    res.json(receipt.events);
  }).on('error', (error) => {
    console.log(error);
    res.send('error!');
  });
});

api.post('/consult', (req, res) => {
  let target = req.body['address'];

  contractInstance.methods.assignConsulation(target).send({
    from: accountAddress,
    gas: '1500000'
  }).on('transactionHash', (hash) => {
    // console.log('hash: ' + hash);
  }).on('confirmation', (confirmationNumber, receipt) => {
    // console.log('confirmationNumber: ' + confirmationNumber);
    // console.log('receipt: ' + receipt);
    res.json(receipt.events);
  }).on('error', (error) => {
    console.log(error);
    res.send('error!');
  });
});


app.use('/api', api);

let server = app.listen(process.env.NODE_PORT, () => {
  let host = server.address().address;
  let port = server.address().port;
  console.log('Node listening at http://%s:%s', host, port);
});
