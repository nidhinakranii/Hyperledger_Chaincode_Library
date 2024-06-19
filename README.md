# fabric-chaincode-demo

## Part 1: Deploying and executing a chaincode

Make sure fabric samples is installed along with the binaries. Check if the fabric-samples/bin folder contains all the binaries from Lab 1.
```
sudo reboot ## restart your vm to free up resources
```
```
cd fabric-samples/test-network
```
```
./network.sh down
```
```
./network.sh up createChannel -ca -s couchdb 
```
You should see the following output if the network was launched succcesfully.

2024-05-31 14:49:48.835 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2024-05-31 14:49:48.888 UTC 0002 INFO [channelCmd] update -> Successfully submitted channel update
Anchor peer set for org 'Org2MSP' on channel 'mychannel'
Channel 'mychannel' joined


Now git clone the fabric-chaincode-demo from the lecture slides in the same folder as fabric-samples.
```
cd ..
```
```
git clone https://github.com/lley154/fabric-chaincode-demo 
```
```
cd fabric-chaincode-demo  
```
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
```
source ~/.bashrc
```
```
nvm install 18.0.0
```
```
npm install
```
Open two terminals for each organization:

Terminal 1:
```
cd fabric-samples/test-network
```
```
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
```
```
sudo chmod a+rwx -R organizations  ## this is only done for lab env
sudo chmod a+rwx -R ../config  ## this is only done for lab env
```
```
peer channel list
```
Terminal 2:
```
cd fabric-samples/test-network
```
```
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
```
```
peer channel list
```
You should see the following output in each terminal window:

2024-05-31 14:56:19.216 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
Channels peers has joined: 
mychannel



In both terminal windows follow these steps:

```
peer lifecycle chaincode package simple_chaincode.tar.gz --path ../fabric-chaincode-demo --lang node --label simple_chaincode_1.0 
```
```
peer lifecycle chaincode install simple_chaincode.tar.gz 
```
```
export PACKAGE_ID=
```
For example, the package ID simple_chaincode_1.0:2917d2e879ef2346b2a856b1b1fb9c883526db8afd5d621ea4f47774953c7adb is from the following output

2024-02-07 16:12:14.444 UTC 0002 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: simple_chaincode_1.0:2917d2e879ef2346b2a856b1b1fb9c883526db8afd5d621ea4f47774953c7adb


Then continue to execute the following commands in sequence in both terminal windows.
```
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name simple_chaincode --version 1.0 --package-id $PACKAGE_ID --sequence 1 --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```
You should get an output something like:

2024-05-31 09:55:07.305 EDT 0001 INFO [chaincodeCmd] ClientWait -> txid [015b732f3826bfafa5755fc3c9117ef652666b3e80e10d5580cd2d3e28a60c4c] committed with status (VALID) at localhost:7051

```
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name simple_chaincode --version 1.0 --sequence 1 --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --output json
```
You should get an output something like this for the first terminal window

{
	"approvals": {
		"Org1MSP": true,
		"Org2MSP": false
	}
}


And once completed in the second terminal window, you should see both orgs have approved the chaincode.

{
	"approvals": {
		"Org1MSP": true,
		"Org2MSP": true
	}
}



In any one terminal follow these steps:
```
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name simple_chaincode --version 1.0 --sequence 1 --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
```
```
peer lifecycle chaincode querycommitted --channelID mychannel --name simple_chaincode --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```
```
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n simple_chaincode --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"put","Args":["hello", "world"]}'
```
```
peer chaincode query -C mychannel -n simple_chaincode -c '{"function":"get","Args":["hello"]}'
```
```
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n simple_chaincode --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"del","Args":["hello"]}'
```
```
peer chaincode query -C mychannel -n simple_chaincode -c '{"function":"get","Args":["hello"]}'
```

## Part 2: Viewing World State Data in CouchDB

We can port forward from our local machine to the virutal machine and then access the CouchDB UI using port 5984.

ssh usage:
```
ssh -L local_port:destination_server_ip:remote_port ssh_server_hostname
```
An example on how to connect is
```
ssh -i lab2.pem -L 5984:ec2-54-91-100-220.compute-1.amazonaws.com:5984 ubuntu@ec2-54-91-100-220.compute-1.amazonaws.com
```
Now, we can access the CouchDB UI locally by using the browser and go to:
```
http://localhost:5984/_utils/#login
username: admin
password: adminpw
```
For the lab report, provide screen shot of the DB view.


