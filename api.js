import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const handleGetCoin = async () => {
    if (loadingRef.current) return;
    setToast('loading...', 'alert-loading');
    loadingRef.current = true;
    
    try {
      // Connect to Phantom wallet
      const provider = window.solana;
      if (!provider || !provider.isPhantom) {
        throw new Error('Phantom wallet not found');
      }
  
      const user = await provider.connect();
      const userPK = new PublicKey(user.publicKey.toString());
  
      const connection = new solanaWeb3.Connection('https://solitary-solitary-brook.solana-devnet.quiknode.pro/59ff9976f07ec18f5fceb2766ebecbb9b2247bc8/')  
      // Fetch balance
      const balance = await connection.getBalance(userPK);
      if (balance === 0) {
        setToast('you don\'t have any SOL', 'alert-error');
        return;
      }
  
      // Construct transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userPK,
          toPubkey: new PublicKey('RecipientPublicKeyHere'), // Replace with actual recipient public key
          lamports: 1000, // Replace with actual amount
        })
      );
  
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPK;
  
      // Sign transaction
      const signedTransaction = await provider.signTransaction(transaction);
      const serializedTransaction = signedTransaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('hex');
  
      // Call backend API
      const nonce = Date.now().toString();
      const userName = generateRandomUsername();
      const message = `I am registering for this game SHIT Match for token OShit with my address ${address} with nonce ${nonce}`;
      const signedMessage = await window.solana.signMessage(new TextEncoder().encode(message), 'utf8');
      const JWTtokn = user?.token; // Replace with actual token if needed
      const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/claimAndRegisterUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: 'OShit', // Replace with actual brand
          tokenSymbol: 'OShit', // Replace with actual token symbol
          encodedTx: serializedTransaction,
          userName: userName, // Replace with actual username
          nonce: nonce, // Replace with actual nonce
          sign: signedMessage, // Replace with actual sign
        }),
      });
      
      const data = await response.json();
      console.log('Backend API response:', data);
  
      setToast('success', 'alert-success');
    } catch (error) {
      setToast(getErrorMessage(error), 'alert-error');
    } finally {
      loadingRef.current = false;
    }
  };
  function generateRandomUsername() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let username = 'User_';
    for (let i = 0; i < 8; i++) {
        username += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return username;
  }
  // Attach to button click
  $(function () {
    $('.claim').click(handleGetCoin);
  });