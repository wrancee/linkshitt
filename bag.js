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
                    if (jwtToken) {
                        $('audio').get(0).play();
                        $('.login').addClass('hidden');
                        $('.init-box').removeClass('hidden');
                    }else {
                        console.error('Login failed.');
                      }
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
  
        const responseData = await response.json();
        localStorage.setItem('jwtToken', responseData.data?.Access); // 存储 jwtToken 到 localStorage
        return responseData.data?.Access;
    } catch (error) {
        console.error('Error logging in:', error);
        return null; // 出现错误时返回 null
    }
  }

function getJwtToken() {
    return localStorage.getItem('jwtToken');
}

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

        const responseData = await response.json();
        console.log("data is here", responseData.data);
        return responseData.data; // 返回 API 响应数据
    } catch (error) {
        console.error('Error fetching user prize account:', error);
        return null; // 出现错误时返回 null
    }
}


$(function () {
    let activeSlots = new Set(); // Keep track of activated slots

    $('.slot').click(function () {
        const slotIndex = $(this).data('slot-index');
        if ($(this).find('.prize').length > 0) {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                activeSlots.delete(slotIndex);
            } else {
                $('.slot').removeClass('active');
                activeSlots.clear();
                $(this).addClass('active');
                activeSlots.add(slotIndex);
            }
        }
    });

    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 28;

    $('.bag1').click(async function () {
        $('.bag').removeClass('hidden');
        $('.init-box').addClass('hidden');
        try {
            const prizes = await queryUserPrizeAccount(); // Fetch user prizes
            if (prizes) {
                const totalItems = prizes.reduce((sum, prize) => sum + prize.amount, 0);
                console.log("Total prize amount:", totalItems); // Debugging output
                totalPages = Math.ceil(totalItems / itemsPerPage);
                displayPrizesInBag(prizes, currentPage); // Display prizes
                setupPagination(prizes);
            } else {
                console.error('Failed to fetch user prizes or no prizes available.');
            }
        } catch (error) {
            console.error('Error fetching prizes:', error);
        }
    });

    function setupPagination(prizes) {
        const prevButton = document.querySelector('.prevPage');
        const nextButton = document.querySelector('.nextPage');

        updatePaginationButtons();

        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                console.log("Previous page:", currentPage); // Debugging output
                displayPrizesInBag(prizes, currentPage);
                updatePaginationButtons();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                console.log("Next page:", currentPage); // Debugging output
                displayPrizesInBag(prizes, currentPage);
                updatePaginationButtons();
            }
        });
    }

    function updatePaginationButtons() {
        const prevButton = document.querySelector('.prevPage');
        const nextButton = document.querySelector('.nextPage');

        if (currentPage === 1) {
            prevButton.disabled = true;
        } else {
            prevButton.disabled = false;
        }

        if (currentPage === totalPages) {
            nextButton.disabled = true;
        } else {
            nextButton.disabled = false;
        }
    }

    function displayPrizesInBag(prizes, page) {
        const backpackContainer = document.querySelector('.wrapper .bag .slots-container');

    // 清除格子中之前的内容
        const slots = backpackContainer.querySelectorAll('.slot');
        slots.forEach(slot => slot.innerHTML = '');

    // 奖品ID和对应图片的映射
        const prizeImageMap = {
            "01J4F71XJAX34SXTE3551SB47Q": "assets/100.png",
            "01J4KZYYKBR7ZYMC9C2Y8C15ZE": "assets/300.png",
            "01J4KZYYKDW20SM37XAPG4G9KS": "assets/600.png",
            "01J4KZYYKEBQ2E8V5RKQB2395C": "assets/1000.png",
            "01J4KZYYKFFZAHZKC4GVSFNB40": "assets/1500.png"
        };

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        let slotIndex = 0;

        prizes.forEach(prize => {
            const imgName = prizeImageMap[prize.prizeId];
            if (imgName) {
                for (let i = 0; i < prize.amount; i++) {
                    if (slotIndex >= start && slotIndex < end) {
                        const slot = slots[slotIndex % itemsPerPage];
                        if (!slot) return; // 确保不会超出可用的格子数

                        const img = document.createElement('img');
                        img.src = imgName;
                        img.className = 'prize';
                        img.style.width = '62px'; // 调整奖品图片的大小
                        img.style.height = '62px'; // 调整奖品图片的大小
                        slot.appendChild(img);
                    }
                    slotIndex++;
                }
            } else {
                console.error(`No image found for prizeId: ${prize.prizeId}`);
            }
        });
    }
});
