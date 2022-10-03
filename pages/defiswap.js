import { Input } from "@nextui-org/react";
import { Card, Col, Row, Button, Text, 
  Modal, useModal, Avatar, Grid, Spacer } from "@nextui-org/react";
import React from "react";
import { useState, useEffect } from "react";
import Web3 from 'web3';
import Web3Modal from "web3modal";
import qs from 'qs';
import Erc20 from '../engine/config.js/erc20.json';
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";

export default function Defiswap() {
    const { visible, setVisible } = useModal();
    const [flogo, getFromLogo] = useState([]);
    const [fname, getFromName] = useState(['Swap From']);
    const [faddr, getFromAddr] = useState([]);
    const [fdec, getFromDec] = useState([]);
    const [tlogo, getToLogo] = useState([]);
    const [tname, getToName] = useState(['Swap To']);
    const [taddr, getToAddr] = useState([]);
    const [tdec, getToDec] = useState([]);
    const [holdup, setHold] = useState('');
    const [wallet, getWallet] = useState([]);
    const [ alert, setAlert ] = useState(false);

    const config = {
      apiKey: "s5k5WqMsGNvkvNrY3SlGoYqJY3zb5XDF",  //alchemy api key 
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config); //to get token balance

    var zeroxapi = 'https://api.0x.org' //api to interact with 0x eth mainnet
                                        //if goerli=> goerli.api.0x.org
    useEffect(() => {
    }, [getFromLogo,getFromName,getFromAddr,getFromDec])

    useEffect(() => {
    }, [getToLogo,getToName,getToAddr])

    useEffect(() => {
      const delayDebounce= setTimeout(() => {
        getPrice();
      }, 1000)
      return () => clearTimeout(delayDebounce)
    }, [holdup])

    let currentTrade = {};
    let currentSelectSide = null;
    let toTrade = {};
    let toSelectSide = null;

    const sendAlert = () => setAlert(true);

    const fromHandler = (side) => {
      if (wallet.includes('0x')) {
         setVisible(true);
         currentSelectSide = side;
         listFromTokens();
      }
      else {
        sendAlert();
      }
    }

    const toHandler = (side) => {
          setVisible(true);
          toSelectSide = side;
          listToTokens();
          getPrice()
    };

    var account = null;
    var web3 = null;

    const closeHandler = () => {
        setVisible(false);
        setAlert(false);
        console.log("closed");
      };

      //connect wallet
      async function connect() {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        web3 = new Web3(connection);
        await connection.send("eth_requestAccounts");
        var accounts = await web3.eth.getAccounts();
        account = accounts[0];
        document.getElementById("wallet-address").textContent = account;
        if (account !== null ){
          document.getElementById("status").textContent = 'CONNECTED!';
        }
        else {
          document.getElementById("status").textContent = 'CONNECT';
        }
        getWallet(account);   //storing in useState
      }
      // Tokens List
      async function listFromTokens(){
        let response = await fetch('http://localhost:3000/api/tokens'); //from tokens.js folder
        let tokenListJSON = await response.json();
        var tokens = tokenListJSON.tokens
        let parent = document.getElementById("token_list"); //show all tokens
        for (const i in tokens){
          let div = document.createElement("div");
          div.className = "token_row";
          let html = `
          <img className="token_list_img" width="12%" src="${tokens[i].logoURI}">
            <span className="token_list_text">${tokens[i].symbol}</span>
            `;
          div.innerHTML = html;
          div.onclick = () => {
            selectFrom(tokens[i]);
          };
          parent.appendChild(div)
        }
      }

//After selecting token from above list
    function selectFrom(token) {
        currentTrade[currentSelectSide] = token;
        closeHandler();
        var fromName = token.name;
        var fromLogo = token.logoURI;
        var fromAddr = token.address;
        var fromDec = token.decimals;
        getFromName(fromName);
        getFromLogo(fromLogo);
        getFromAddr(fromAddr);
        getFromDec(fromDec);
    }

    async function displayBalance(){
      const tokenContractAddresses = [faddr];
                                    //showing balance using alchemy-sdk API, in hex
      const data = await alchemy.core.getTokenBalances(
        wallet,
        tokenContractAddresses
      )
      data.tokenBalances.find(item => {
        let rawbalance = parseInt(item.tokenBalance, 16).toString() //From Hex to decimal
        let formatbalance = Number(Web3.utils.fromWei(rawbalance))  //big number to decimal
        let balance = formatbalance.toFixed(2);                     // 2 decimals
        if (item.tokenBalance === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          document.getElementById("get_balance").innerHTML = '0.00'
        }
        else {
          document.getElementById("get_balance").innerHTML = balance
        }

       })
    }
        //Swap-To Tokens List
    async function listToTokens(){
      let response = await fetch('http://localhost:3000/api/tokens');
      let tokenListJSON = await response.json();
      var tokens = tokenListJSON.tokens
      let parent = document.getElementById("token_list");
      for (const i in tokens){
        let div = document.createElement("div");
        div.className = "token_row";
        let html = `
        <img className="token_list_img" width="12%" src="${tokens[i].logoURI}">
        <span className="token_list_text">${tokens[i].symbol}</span>
          `;
        div.innerHTML = html;
        div.onclick = () => {
          selectTo(tokens[i]);  //on selecting
        };
        parent.appendChild(div)
      }
    }
//On Selection token from list
  function selectTo(token) {
      toTrade[toSelectSide] = token;
      closeHandler();
      var toName = token.name;
      var toLogo = token.logoURI;
      var toAddr = token.address;
      var toDec = token.decimals;
      getToName(toName);
      getToLogo(toLogo);
      getToAddr(toAddr);
      getToDec(toDec);
      displayBalance();
  }
  async  function  getPrice(){
    console.log("Getting Price");
    //to get swap price, all three values should be there
    if (!faddr || !taddr || !document.getElementById("from_amount").value) return;
    let  amount = Number(document.getElementById("from_amount").value * 10 ** fdec);//fdec is decimal of selected coin
    //for 0x api call
    const params = {
      sellToken: faddr,
      buyToken: taddr,
      sellAmount: amount,
    }
    //Api call from 0x documentation:Get/swap/v1/quote
    const response = await fetch(zeroxapi +`/swap/v1/price?${qs.stringify(params)}`);
    const sources = await fetch(zeroxapi + `/swap/v1/quote?${qs.stringify(params)}`);
    var swapPriceJSON = await  response.json();
    console.log(swapPriceJSON)
    var swapOrders = await sources.json();   //from quote 0x api to get Pool
    try {await swapOrders.orders.find(item => {
     document.getElementById("defisource").innerHTML = item.source;
    })}
    catch (error) {
      document.getElementById("defisource").innerHTML = "Pool Not Available";
    }
    var rawvalue = swapOrders.buyAmount / (10 ** tdec)    //using quote 0x api
    var value = rawvalue.toFixed(2);
    document.getElementById("to_amount").innerHTML = value
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas; //from price 0x api 
}

async function swapit() {
  if (!faddr || !taddr || !document.getElementById("from_amount").value) return;
  const web3Modal = new Web3Modal();
  const connection = await web3Modal.connect();
  web3 = new Web3(connection);
  const provider = new ethers.providers.Web3Provider(connection);
  const signer = provider.getSigner();
  const userWallet = await signer.getAddress();
  let  amount = Number(document.getElementById("from_amount").value * 10 ** fdec);
  const params = {
    sellToken: faddr,
    buyToken: taddr,
    sellAmount: amount,
  }
  const fromTokenAddress = faddr;
  const getquote = await fetch(zeroxapi + `/swap/v1/quote?${qs.stringify(params)}`); //from quote 0x api
  var quote = await getquote.json()
  var proxy = quote.allowanceTarget  //Proxy is 0x contractAddress
  var amountstr = amount.toString();
  const ERC20Contract = new ethers.Contract(fromTokenAddress, Erc20, signer);
  const approval = await ERC20Contract.approve(proxy, amountstr) //approving 0x contract for user's tokens
  await approval.wait()
  const txParams = {  //sending Tx using web3
    ...quote,
    from: userWallet,
    to: quote.to,
    value: (quote.value).toString(16),
    gasPrice: null, //let Metamask decide the gas
    gas: quote.gas,
  }
  await ethereum.request({  //Transaction
    method: 'eth_sendTransaction',
    params: [txParams],
  });
  }


  return (
    <Grid.Container gap={1} justify='center'>
                    <Button rounded color="primary" onPress={connect} css={{boxShadow:'0px 0px 4px #000000'}}>
                <Text
                  css={{ color: "white" }}
                  size={16}
                  weight="bold"
                  transform="uppercase"
                  id='status'
                >
                  CONNECT
                </Text>
              </Button>
      <Row justify="center">
      <Grid sm={4} >
    <Card 
      variant="bordered"
    >
      <Card.Header>
        <Row >
          <Col>
            <img src="n2dex2-base.png" width={"80%"} />
            </Col>
            <Col>
            <Avatar
              src="profile.jpg"
              css={{ size: "$20" }}
              zoomed
              bordered
              color="gradient"
            />
          </Col>
          <img src="0xpicw.png" width={"80%"} />
        </Row>
      </Card.Header>
      <Text
        h3={true}
        color="white"
        css={{
          textShadow: "0px 0px 1px #000000",
          display: "flex",
          justifyContent: "center",
          textRendering:'geometricPrecision',
          fontFamily:'SF Pro Display',
          fontWeight:'$bold',
          m:'$0'
        }}
      >
        Token Swap
      </Text>
      </Card>
      </Grid>
      </Row>
      <Modal
        scroll
        closeButton
        blur
        aria-labelledby="connect_modal"
        onClose={closeHandler}
        open={alert}
      > Please Connect Wallet
        <Modal.Footer>
        <Button auto flat color="primary" onClick={connect}>
            Connect Wallet
          </Button>
          <Button auto flat color="error" onClick={closeHandler}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Text h5='true'>FROM TOKEN</Text>
      <Row justify="center">
      <Grid sm={4}>
        <Col>
        <Card variant="bordered" css={{
          color: "white",
          opacity: "80%",
          fontFamily: "SF Pro Display",
          fontWeight: "300",
          fontSize: "30px",
          textShadow: "0px 0px 2px #000000",
          boxShadow: "0px 0px 4px #39FF14",
        }}>
          
        <Col>
            <Input type='text'
            size="$3xl"
            css={{fontFamily:'SF Pro Display',color:'white'}} 
            className="number"
            color="default"
            placeholder="amount"
            id="from_amount"
            onChange={(e) => setHold(e.target.value)}
            />
            </Col>
            </Card>
            </Col>
            <Col>
            <a onClick={fromHandler}>
            <Text size='$3xl' css={{fontFamily:'SF Pro Display',
            textShadow:'0px 0px 1px #000000',
            fontWeight:'400',
            color:'white',
            ml:'$10',
            }} ><img src={flogo} style={{width:'50px'}}/>{' '+fname}</Text>
            </a>
            <Row justify="center">
            <Text css={{marginLeft:'$3', fontSize:'$lg'}}>Balance:</Text><Text css={{marginLeft:'$3', fontSize:'$lg', fontFamily:'SF Pro Display', color:"$blue600"}} id='get_balance'></Text>
            </Row>
            </Col>
            </Grid>
            </Row>
      <Modal
        scroll
        closeButton
        blur
        aria-labelledby="token_modal"
        onClose={closeHandler}
        open={visible}
      >
        <Modal.Body>
        <Input type='text'
            size="$3xl"
            css={{fontFamily:'SF Pro Display',color:'white'}} 
            className="number"
            color="default"
            placeholder="Paste Token Address"
            />
            <Text size={16}>Or Choose Below:</Text>
          <div id="token_list"></div>
        </Modal.Body>
        <Modal.Footer>
          <Button auto flat color="error" onClick={closeHandler}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Row justify="center">
        <img src="arrow.png" width={"2%"} />
      </Row>
      <Row justify="center">
      <Grid sm={4}>
      <Card
        variant="bordered" css={{
          color: "white",
          opacity: "80%",
          fontFamily: "SF Pro Display",
          fontWeight: "300",
          fontSize: "30px",
          textShadow: "0px 0px 2px #000000",
          boxShadow: "0px 0px 4px #39FF14",
        }}
      >
          <Col>
          <Text type='text'
            size="$4xl"
            css={{fontFamily:'SF Pro Display',color:'white',
            textShadow:"0px 0px 3px #39FF14", ml:'$2'}} 
            className="number"
            color="default" id="to_amount" />
          </Col>
          </Card>
          <Spacer />
          <Col>
          <a onClick={toHandler}>
            <Text size='$3xl' css={{fontFamily:'SF Pro Display',
            textShadow:'0px 0px 1px #000000',
            fontWeight:'400',
            color:'white',
            ml:'$10',
            }}><img src={tlogo} style={{width:'50px'}}/>{' '+tname}</Text>
            </a>
            </Col>
        </Grid>
      </Row>
      <Grid sm={4}>
      <Row justify="center">
        
      <Card isPressable css={{backgroundColor:'#39FF14'}} onPress={swapit}>
                <Text
                  css={{display:'flex',justifyContent:'center',color: "black", textShadow:'0px 0px 2px #000000' }}
                  size="$3xl"
                  weight="bold"
                  transform="uppercase">
                 SWAP !
                </Text>
              </Card>
             
              </Row>
              </Grid>
      <Row justify="center">
      <Grid sm={4}>
      <Row>
      <Text size={20} css={{marginLeft:'$5', color:'white'}} >Gas Estimate: </Text> 
      <p style={{fontFamily:'SF Pro Display',
      fontSize:'24px',
      marginLeft:'4px', 
      color:'#39FF14',fontWeight:'bold',
      textShadow:'0px 0px 1px #000000'}} id='gas_estimate'></p>
      </Row>
      <Row>
      <Text size={24} css={{marginLeft:'$5', color:'white'}} >LP Provider: </Text> 
      <p style={{fontFamily:'SF Pro Display',
      fontSize:'25px', 
      marginLeft:'4px', 
      color:'#39FF14',
      fontWeight:'bold',
      textShadow:'0px 0px 1px #000000'}} id='defisource'></p>
      </Row>
      </Grid>
      </Row>
      <Row justify="center">
      <Grid sm={4}>
        <Row justify="center">
      <Card
        css={{
          borderTop: "$borderWeights$light solid rgba(255, 255, 255, 0.2)",
        }}
      >
          <Row justify="center" css={{mt:'$2'}}>
              <Text color="#fff" size={10}>
                Secured with
              </Text>
              <img src="alchemy-white.png" width={"30%"} />
              </Row>
              <Row justify="center" css={{mt:'$2'}}>
            <Text
              size={20}
              id="wallet-address"
              css={{ color: "#39FF14", textShadow: "0px 0px 3px #000000",marginRight: "$2" }}
            />
            </Row>
      </Card>
      </Row>
      </Grid>
      </Row>
    </Grid.Container>
  );
}