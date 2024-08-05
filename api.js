import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

$(function () {
  $('.claim').click(async function () {
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
        try {
            const userPK = publicKey
            const balance = await connection.getBalance(userPK)
            // 判断是否为 0
            if (balance === 0) {
              setToast('you don\'t have any SOL', 'alert-error')
            }
            else {
                const dexNativeAccountMPK = new solanaWeb3.PublicKey(dexAccount);
                const computeBudgetPriceInst = solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: user?.walletType.toLocaleLowerCase() === 'phantom' ? 1000 : 100000
                });
                const computeBudgetLimitInst = solanaWeb3.ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });
                const toDexInst = solanaWeb3.SystemProgram.transfer({ fromPubkey: userPK, toPubkey: dexNativeAccountMPK, lamports: 2250000 });

                const instructions = [computeBudgetPriceInst, computeBudgetLimitInst];
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')
                const transaction = new solanaWeb3.Transaction({ feePayer: userPK, blockhash, lastValidBlockHeight })
                const provider = getProvider('phantom')
                const message = transaction.compileMessage()
                const feeInLamports = await connection.getFeeForMessage(message);
                let toDexVaue = feeInLamports.value * (dexFeeRate / 100)
                if (toDexVaue > maxDexFee) toDexVaue = maxDexFee
                const toDexInst2 = solanaWeb3.SystemProgram.transfer({
                    fromPubkey: userPK,
                    toPubkey: dexNativeAccountMPK,
                    lamports: toDexVaue
                })
                const transactionReal = new solanaWeb3.Transaction({ feePayer: userPK, blockhash, lastValidBlockHeight })
                const signedTransaction = await provider.signTransaction(transactionReal);
                const t = signedTransaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('hex')

            }
        }catch (error) {
         setToast(getErrorMessage(error), 'alert-error')
        }
        loadingRef.current = false
    }

    // 调用后端API
    async function callBackendAPI(signature, userName) {
      const brand = 'YourBrand'; // 替换为实际品牌名称
      const tokenSymbol = 'YourTokenSymbol'; // 替换为实际代币符号
      const encodedTx = Buffer.from(signature).toString('base64'); // 将交易签名编码
      const nonce = 'RandomNonce'; // 替换为实际的随机数
      const sign = 'YourSign'; // 替换为实际的签名

      try {
        const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/claimAndRegisterUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand,
            tokenSymbol,
            encodedTx,
            userName,
            nonce,
            sign,
          }),
        });
        const data = await response.json();
        console.log('Backend API response:', data);
      } catch (err) {
        console.error('Error calling backend API:', err);
      }
    }

    // 主函数
    async function main() {
      const publicKey = await connectWallet();
      if (publicKey) {
        const userName = 'YourUserName'; // 替换为实际的用户名
        const signature = await claimToken(publicKey);
        if (signature) {
          await callBackendAPI(signature, userName);
        }
      }
    }

    // 运行主函数
    main();
  });
});
