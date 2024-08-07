import { Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram } from 'https://cdn.skypack.dev/@solana/web3.js';

// 连接Phantom钱包
async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const response = await window.solana.connect();
      console.log('Connected to Phantom wallet:', response.publicKey.toString());
      return response.publicKey;
    } catch (err) {
      console.error('Error connecting to Phantom wallet:', err);
    }
  } else {
    alert('Please install Phantom wallet extension');
  }
}

// 构建和发送交易
async function claimToken(publicKey) {
    const connection = new Connection('https://api.devnet.solana.com'); // 使用Devnet进行测试

    const balance = await connection.getBalance(publicKey);
    if (balance === 0) {
      alert('You don\'t have any SOL');
      return;
    }

    const computeBudgetPriceInst = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: window.solana.walletType.toLocaleLowerCase() === 'phantom' ? 1000 : 100000,
    });
    const computeBudgetLimitInst = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });

    const instructions = [computeBudgetPriceInst, computeBudgetLimitInst];
    const dexNativeAccountMPK = new solanaWeb3.PublicKey(dexAccount)
    const lamports = 2250000;

    const toDexInst = SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: dexNativeAccountMPK,
      lamports: lamports,
    });

    instructions.push(toDexInst);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    const transaction = new Transaction({ feePayer: publicKey, blockhash, lastValidBlockHeight });
    transaction.add(...instructions);

    try {
      const signedTransaction = await window.solana.signTransaction(transaction);
      console.log('Transaction signed:', signedTransaction);

      const t = signedTransaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('hex');
      console.log('Serialized transaction (t):', t);

      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      console.log('Transaction successful with signature:', signature);

      return t;
    } catch (err) {
      console.error('Error sending transaction:', err);
    }
  }

// 生成随机用户名
function generateRandomUsername() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let username = 'User_';
    for (let i = 0; i < 8; i++) {
        username += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return username;
}

// 调用后端API
async function callBackendAPI(encodedTx) {
    const brand = 'OShit';
    const tokenSymbol = 'OShit'; 
    const nonce = Date.now().toString();
    const username = generateRandomUsername();
    const message = 'I am registering for this game SHIT Match for token OShit with my address ${address} with nonce ${nonce}'; // 替换为实际的签名

    try {
      const signedMessage = await window.solana.signMessage(new TextEncoder().encode(message), 'utf8');
      const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/claimAndRegisterUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: brand,
          tokenSymbol: tokenSymbol,
          encodedTx: encodedTx,
          userName: username,
          nonce: nonce,
          sign: signedMessage,
        }),
      });
      const data = await response.json();
      console.log('Backend API response:', data);
    } catch (err) {
      console.error('Error calling backend API:', err);
    }
}


$(function () {
  $('.claim').click(async function () {
    const publicKey = await connectWallet();
    if (publicKey) {
        const encodedTx = await claimToken(publicKey);
        if (encodedTx) {
            await callBackendAPI(encodedTx);
        }
    }
  });
});
