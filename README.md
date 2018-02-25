# Build your own DAPP step by step

## Overview

**This part only shows you how to get your environment set up and play around the current functions I've already built. The tutorial and more fancy functions will come up later. The latest update is [HERE](https://github.com/congxinUSC/Web3Study).**

This is a Node.js express server that uses Web3.js APIs to create, deploy and interact with a customized smart contract.

Before you start, make sure you [Node](https://nodejs.org/en/) installed. It will be easier to understand what's going on if you are familiar with [express](https://expressjs.com/), [web3.js](https://web3js.readthedocs.io/en/1.0/) and [Solidity](https://solidity.readthedocs.io/en/develop/).

After cloning this repo to your own pc or what ever, you need to download the needed packages. Open a terminal, cd to the root directory of this project and type:

`$ npm install`

After a while the dependencies should be automatically installed. There is one additional package you would like to install manually if not installed before. We use [nodemon](https://nodemon.io/) to monitor for any changes in our source and automatically restart your server. This means after editing your source code you don't have to restart the server over and over again, which makes life easier. To install:

`$ npm install -g nodemon`

The -g parameter means installing nodemon globally so that you don't need to install it again for your other projects and it'll be much easier to access the command nodemon. This might require administrator rights so if you got errors while installing it, sudo and try again.

We also need a [Ethereum](https://www.ethereum.org/) client for testing and development. For instance I used this [testrpc](https://www.ethereum.org/). To install:

`$ npm install -g ethereum-testrpc`

Now you can play with the whole thing. First you need to start testrpc as our DAPP's provider.

`$ testrpc -u 1,2 -l 2000000 -g 1`

Then open up another terminal, make sure you're in the project's root directory and type:

`$ npm test`

What this does is that it start's up two express servers, both waiting for users to interact with them by HTTP requests. **Since one of the servers are running in the background, you have to kill the process manually after testing.** Let's say they are listening at http://localhost:23456 and http://localhost:23457.

If you looked into app.js, there are 5 endpoints: POST(/login), POST(/connect), POST(/write), GET(/deploy) and POST(/read). We will see how they work by following these steps.

Open up a HTTP client, for example [Postman](https://www.getpostman.com/), and then create a new POST request to http://localhost:23456/login with the body like this:

```
{
	"privateKey":"<some private key>"
}
```

The value of privateKey should come from your testrpc. This step is simulating the process of logging in your Ethereum account, the response will be the account's address. Pick a nother private key from testrpc and make the simular request to the other express server.

Now you got two running nodes but no smart contract deployed onto the blockchain. To deploy, make **one** get request to either server, for example http://localhost:23456/deploy. The response is the address of the deployed smart contract, we will use this address right away.

Since the node that deployed the contract is already connected to it, you need to connect the other node to the contract by a POST request to http://localhost:23457/connect with the body:

```
{
	"address":"<the address where the smart contract is deployed>"
}
```

At this point you have both nodes connected to the **same** smart contract instance on the blockchian, you can use it to share data. In fact this dummy smart contract can't do anything else. Let's say we want to write form the first node. POST to http://localhost:23456/write with the body:

```
{
	"address":"<the target user addres>",
	"content":"some content"
}
```

If everything's all right you will be able to read this content from the other node by POST http://localhost:23457/read with the body:
```
{
	"address":"<the target user addres>",
}
```

The response should be a JSON file containing a list of all the target user's records. However, since the records are encrypted, **only the owner of the records can get the right content**, others just got a message telling that decryption is failed.

Done! That's all I have for now. I'm not a native English speaker so please forgive my syntax errors. I will update the code and comments later if given time.