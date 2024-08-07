import bs58 from 'https://cdn.jsdelivr.net/npm/bs58@6.0.0/+esm';

//log in click function
$(function () {
    $('.login-btn').click(async function () {
        if (window.solana && window.solana.isPhantom) {
            try {
                await window.solana.connect();
                let defAddress = window.solana.publicKey;
                const address = defAddress.toString();
                $('#wallet-address').text(`Connected wallet address: ${address}`);
  
                const isRegistered = await checkAddressRegistration(address);

                if (isRegistered === null) {
                    console.error('Failed to check registration status.');
                    // Handle the error case, e.g., show an error message to the user
                } else if (isRegistered) {
                    const jwtToken = await loginWithWallet(address);
                    console.log('JWT is defined as', jwtToken);

                } else {
                    console.log('Address is not registered.');
                    $('.login').addClass('hidden');
                    $('.newPlayer').removeClass('hidden');
                }
              } catch (error) {
                  console.error('Failed to connect to the wallet:', error);
              }
          } else {
              alert('Please install a Solana wallet extension like Phantom.');
          }
    });
  });
  
  //check if registered
  async function checkAddressRegistration(address) {
    try {
        const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/isAddressRegistered', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ nativeAddress: address }).toString(),
        });
  
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
  
        const result = await response.json();
        return result.data; // Assuming 'data' field in the response contains the registration status
    } catch (error) {
        console.error('Error checking address registration:', error);
        return null;
    }
  }
  
  //log in and get jwt token
  async function loginWithWallet(address) {
    const nonce = new Date().getTime();
    const message = `I am login game with my address ${address} with nonce ${nonce}`;
    const signedMessage = await window.solana.signMessage(new TextEncoder().encode(message), 'utf8');  
    try {
        const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/loginWithWallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                nativeAccount: address,
                nonce: nonce,
                sign: bs58.encode(signedMessage.signature || '')
            }),
        });
  
        if (!response.ok) {
            throw new Error(`Login API request failed with status ${response.status}`);
        }
  
        const data = await response.json();
        console.log('API response data:', data); // 调试输出 API 返回的数据
        
        localStorage.setItem('jwtToken', data.Access); // 存储 jwtToken 到 localStorage
        console.log("data Access is: ", data.Access);
        return data.Access;
    } catch (error) {
        console.error('Error logging in:', error);
        return null; // 出现错误时返回 null
    }
  }

function getJwtToken() {
    return localStorage.getItem('jwtToken');
}

//bag click function
$(function () {
    $('.bag').click(async function () {
        try {
            const prizes = await queryUserPrizeAccount(); // 直接调用 queryUserPrizeAccount 函数获取奖品信息
            if (prizes) {
                displayPrizesInBag(prizes); // 调用 displayPrizesInBag 函数显示奖品
            } else {
                console.error('Failed to fetch user prizes or no prizes available.');
            }
        } catch (error) {
            console.error('Error fetching prizes:', error);
        }
    });
});

//let all the prizes shown in the bag
function displayPrizesInBag(prizes) {
    const backpackContainer = document.querySelector('.wrapper .bag');

    // Clear any previous content in the slots
    const slots = backpackContainer.querySelectorAll('.slot');
    slots.forEach(slot => slot.innerHTML = '');

    const prizeImageMap = {
        "PRIZE_ID_100": "100.png",
        "PRIZE_ID_300": "300.png",
        "PRIZE_ID_600": "600.png",
        "PRIZE_ID_1000": "1000.png",
        "PRIZE_ID_1500": "1500.png"
    };

    prizes.forEach((prize, index) => {
        const slot = slots[index];
        if (!slot) return; // Ensure we do not exceed the number of available slots

        const imgName = prizeImageMap[prize.prizeId];
        if (imgName) {
            for (let i = 0; i < prize.amount; i++) {
                const img = document.createElement('img');
                img.src = imgName;
                img.className = 'prize';
                img.style.width = '40px'; // Adjust prize image size
                img.style.height = '40px'; // Adjust prize image size
                slot.appendChild(img);
            }
        } else {
            console.error(`No image found for prizeId: ${prize.prizeId}`);
        }
    });
}

async function fetchAndStorePrizeData() {
    const prizes = await queryUserPrizeAccount(); // Call your function

    if (prizes && prizes.length > 0) {
        const packIds = prizes.map(prize => prize.packId);
        const prizeIds = prizes.map(prize => prize.prizeId);

        // Optionally store them in localStorage for later use
        localStorage.setItem('packIds', JSON.stringify(packIds));
        localStorage.setItem('prizeIds', JSON.stringify(prizeIds));

        console.log('Pack IDs:', packIds);
        console.log('Prize IDs:', prizeIds);

    } else {
        console.error('No prizes found or an error occurred.');
    }
}

$(function () {
    $('.bag1').click(fetchAndStorePrizeData); // Trigger the function when the bag is clicked
});

//api for get prizes infos
async function queryUserPrizeAccount(packId = '', prizeId = '') {
    try {
        const jwtToken = getJwtToken(); // 从 localStorage 中获取 jwtToken
        if (!jwtToken) {
            throw new Error('No JWT token found, please log in first.');
        }

        const requestURL = 'https://testnet.oshit.io/meme/api/v1/sol/game/queryUserPrizeAccount';
        const headers = {
            'Authorization': `Bearer ${jwtToken}`,  // 将 jwtToken 添加到请求头
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const formData = new URLSearchParams({
            packId: packId,
            prizeId: prizeId
        });

        const response = await fetch(requestURL, {
            method: 'POST',
            headers: headers,
            body: formData.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // 返回 API 响应数据
    } catch (error) {
        console.error('Error fetching user prize account:', error);
        return null; // 出现错误时返回 null
    }
}

//点击奖品兑换功能
$(function () {
    let activeSlots = new Set(); // Keep track of activated slots

    $('.slot').click(function () {
        const slotIndex = $(this).data('slot-index');

        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            activeSlots.delete(slotIndex);
        } else {
            $(this).addClass('active');
            activeSlots.add(slotIndex);
        }

        updateRedeemButtonState();
    });

    function updateRedeemButtonState() {
        const redeemBtn = $('#redeem-btn');

        if (activeSlots.size > 0) {
            redeemBtn.prop('disabled', false);
            redeemBtn.addClass('active');
        } else {
            redeemBtn.prop('disabled', true);
            redeemBtn.removeClass('active');
        }
    }

    $('#redeem-btn').click(function () {
        if (activeSlots.size > 0) {
            // Add your redeem logic here
            console.log('Redeeming prizes from slots:', Array.from(activeSlots));
        }
    });
});
