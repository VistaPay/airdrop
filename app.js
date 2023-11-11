let web3;
let airdropContract;
const airdropContractAddress = '0xaE3ff226EE53BF20FF5E0551E366118c746155Fa'; 
const airdropContractABI = [ { "inputs": [], "name": "claimTokens", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_fee", "type": "uint256" } ], "name": "setClaimFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_maxSupply", "type": "uint256" } ], "name": "setMaxAirdropSupply", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_maxClaims", "type": "uint256" } ], "name": "setMaxClaimsPerAddress", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_tokens", "type": "uint256" } ], "name": "setTokensPerClaim", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "startAirdrop", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "stopAirdrop", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_tokenAddress", "type": "address" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "inputs": [], "name": "UpdateContract", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "wTokens", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }, { "inputs": [], "name": "admin", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "airdropActive", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "claimFee", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "claims", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxAirdropSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxClaimsPerAddress", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "token", "outputs": [ { "internalType": "contract IERC20", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tokensPerClaim", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalAirdropped", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ]

// Function to connect to MetaMask
async function connectWallet() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            airdropContract = new web3.eth.Contract(airdropContractABI, airdropContractAddress);
            await updateContractDetails();
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

        // Check for sufficient BNB balance
        const balanceWei = await web3.eth.getBalance(accounts[0]);
        const balance = web3.utils.fromWei(balanceWei, 'ether');
        if (parseFloat(balance) < 0.004) {
            showToast("You don't have enough BNB to proceed.")
            return;
        }

         const claimFee = await airdropContract.methods.claimFee().call();

        // Estimate gas limit
        const gasEstimate = await airdropContract.methods.claimTokens().estimateGas({ from: accounts[0], value: claimFee });

        showToast("Transaction initiated. Please confirm in your wallet.", 'pending');
        airdropContract.methods.claimTokens().send({
            from: accounts[0],
            value: claimFee,
            gas: gasEstimate
        }).on('receipt', function(receipt) {
            showToast("Airdrop Claim successful!", 'success');
        }).on('error', function(error) {
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
    console.log("Error received: ", error); // Log the received error
  
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

    console.log("Final message: ", finalMessage); // Log the final message
    toastMessage.textContent = finalMessage;
    toast.className = "toast show";
  
    setTimeout(function() { toast.className = toast.className.replace("show", ""); }, state === 'pending' ? 50000 : 5000);
}





document.addEventListener('DOMContentLoaded', function() {

    const claimButton = document.getElementById('claim_btn');
    const twitterCheckbox = document.getElementById('twitterCheckbox');
    const telegramCheckbox = document.getElementById('telegramCheckbox');
    
    // Enable the checkboxes on page load
    twitterCheckbox.disabled = false;
    telegramCheckbox.disabled = false;
    
    function openLinkAndCheckCheckbox(checkbox, url) {
        checkbox.checked = true;
        window.open(url, '_blank');
        updateClaimButtonState();
    }
    
    // Event listeners for the checkboxes to open links and check the boxes
    twitterCheckbox.addEventListener('click', function() {
        openLinkAndCheckCheckbox(this, 'https://twitter.com/VistapayGlobal');
    });
    
    telegramCheckbox.addEventListener('click', function() {
        openLinkAndCheckCheckbox(this, 'https://telegram.me/vistapay');
    });
    
    // Function to update the claim button state
    function updateClaimButtonState() {
        claimButton.disabled = !twitterCheckbox.checked || !telegramCheckbox.checked; 
    }
    
    // Update the claim button state on page load
    updateClaimButtonState();
    

    connectWallet();
    document.getElementById('claim_btn').addEventListener('click', claimTokens);
});
