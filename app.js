let web3;
let airdropContract;
const airdropContractAddress = '0x417BB5ADb035795bC17c1Ff7169FDB88d1AE54Ae'; 
const airdropContractABI = [ { "inputs": [ { "internalType": "address", "name": "_referrer", "type": "address" } ], "name": "claimTokens", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "ETH", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_fee", "type": "uint256" } ], "name": "setClaimFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_maxSupply", "type": "uint256" } ], "name": "setMaxAirdropSupply", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_maxClaims", "type": "uint256" } ], "name": "setMaxClaimsPerAddress", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_reward", "type": "uint256" } ], "name": "setReferralReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_tokens", "type": "uint256" } ], "name": "setTokensPerClaim", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "startAirdrop", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "stopAirdrop", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "Tokens", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_tokenAddress", "type": "address" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "stateMutability": "payable", "type": "receive" }, { "inputs": [], "name": "admin", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "airdropActive", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "claimFee", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "claims", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxAirdropSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxClaimsPerAddress", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "referralReward", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "referralRewards", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "token", "outputs": [ { "internalType": "contract IERC20", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tokensPerClaim", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalAirdropped", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ];

// Function to connect to MetaMask
async function connectWallet() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            airdropContract = new web3.eth.Contract(airdropContractABI, airdropContractAddress);

            await updateContractDetails();
            await handleReferralLink(); // Call handleReferralLink here
        } catch (error) {
            showToast(error);
        }
    } else {
        showToast("Non-Ethereum browser detected. You should consider trying MetaMask or Trustwallet!");
    }
}


async function claimTokens() {
    if (!web3) {
        showToast("Web3 is not initialized. Connect to Wallet first.");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
            showToast("Please connect to your wallet.");
            return;
        }

        const balanceWei = await web3.eth.getBalance(accounts[0]);
        const balance = web3.utils.fromWei(balanceWei, 'ether');
        if (parseFloat(balance) < 0.004) {
            showToast("Insufficient BNB balance. You need at least $1 in your wallet to proceed.");
            return;
        }

        const claimFee = await airdropContract.methods.claimFee().call();

        // Get the referral address from URL
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref') || "0x0000000000000000000000000000000000000000";

        // Estimate the gas limit for the transaction
        const gasEstimate = await airdropContract.methods.claimTokens(referrer).estimateGas({ from: accounts[0], value: claimFee });

        showToast("Transaction initiated. Please confirm in your wallet.", 'pending');
        airdropContract.methods.claimTokens(referrer).send({
            from: accounts[0],
            value: claimFee,
            gas: gasEstimate
        })
        .on('receipt', function(receipt) {
            showToast("Airdrop Claim successful!", 'success');
        })
        .on('error', function(error) {
            showToast("Transaction failed: " + error.message, 'error');
        });
    } catch (error) {
        showToast(error);
    }
}

  


async function updateContractDetails() {
    try {
        const airdropActive = await airdropContract.methods.airdropActive().call();
        const airdropStatusElement = document.getElementById('airdrop_active');
        if (airdropActive) {
            airdropStatusElement.textContent = 'Active';
            airdropStatusElement.style.color = 'lime'; // Active color
        } else {
            airdropStatusElement.textContent = 'Inactive';
            airdropStatusElement.style.color = 'red'; // Inactive color
        }
    } catch (error) {
        showToast(error);
    }
}

function showToast(error, state = 'error') {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastMessage = document.getElementById("toast-message");
  
    let iconSrc = (state === 'error') ? 'error.png' :
                  (state === 'success') ? 'success.png' :
                  (state === 'pending') ? 'pending.png' : 'error.png';
    toastIcon.src = iconSrc;
  
    let finalMessage;
    let errorMessage = typeof error === 'string' ? error : error.message;

    // Check if the error message contains 'execution reverted'
    if (errorMessage && errorMessage.includes('execution reverted')) {
        const errorRegex = /execution reverted: (.*)/;
        const matches = errorRegex.exec(errorMessage);
        if (matches && matches[1]) {
            finalMessage = matches[1].replace(/["',]/g, ''); // Remove double quotes and comma
        }
    } else {
        // If it's a normal message or doesn't match the pattern, display as it is
        finalMessage = errorMessage;
    }
    toastMessage.textContent = finalMessage;
    toast.className = "toast show";
  
    setTimeout(function() { toast.className = toast.className.replace("show", ""); }, state === 'pending' ? 5000 : 5000);
}


async function handleReferralLink() {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
        showToast("Please connect to your wallet.");
        return;
    }
    
    // Generate and display referral link
    const baseURL = window.location.origin;
    const referralLink = `${baseURL}?ref=${accounts[0]}`;
    document.getElementById('referral_link').textContent = referralLink;

    // Check URL for referrer and display
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    if (referrer) {
        document.getElementById('referred_by').textContent = referrer;
    }
}



document.addEventListener('DOMContentLoaded', function() {

    const selfClickElement = document.getElementById('self_click');
    const referralLinkElement = document.getElementById('referral_link');

    if (selfClickElement) {
        selfClickElement.addEventListener('click', function() {
            const textToCopy = referralLinkElement.innerText;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        alert('Link copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Error in copying text: ', err);
                    });
            } else {
                // Fallback for browsers without clipboard API support
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
                alert('Link copied to clipboard!');
            }
        });
    }

    connectWallet();
    document.getElementById('claim_btn').addEventListener('click', claimTokens);
});