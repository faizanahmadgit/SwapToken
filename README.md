pages/api/tokens.js  extracted from https://tokens.coingecko.com/uniswap/all.json
Ox Documentation : https://docs.0x.org/0x-api-swap/api-references/get-swap-v1-price

1-Create an new NextJS app:

npx create-next-app defiswap

2- Install Dependencies:

cd defiswap
npm i @nextui-org/react web3 web3modal ethers alchemy-sdk sf-font
npm i --save-dev @types/react
npm i --save-dev @types/qs
3- Replace all files and folders in your project with the ones attached to this repo.

Add all files and folders to the root project directory "defiswap", overwrite when prompted.

4- Create a new Alchemy API App for Ethereum Mainnet and update the API Key field with your

Alchemy API Key in the defiswap.js file

 const config = {
      apiKey: "PLACE YOUR API KEY",
      network: Network.ETH_MAINNET,
    };
Save File after updating!

5- Start your application, navigate to the project page and enjoy!

npm run dev
############################################################################

OPTIONAL - If you just need to add the DeFI swap to any NextJS Project:

Install dependencies from step 2 to your project root folder.

Add the engine folder and the public folder contents to your project root folder.

Add the tokens.js in pages/api folder and the defiswap.js in /pages folder.

Import the defiswap interface in app.js or any other page accordingly:

import Defiswap from './defiswap';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Defiswap />
    </div>
  );
}


