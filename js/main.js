const DEFAULT_VALUES = {
    NFT_NAME: "Example NFT",
    NFT_DESCRIPTION: "Minted at https://3rror404.github.io/sui-nft/",
    NFT_IMAGE_URL: "https://3rror404.github.io/sui-nft/img/sui-nft-example.jpg"
}
const btnConnectWallet = document.querySelector('#btn-connect-wallet');
const btnCreate = document.querySelector('#btnCreate');
const nftCreateWrap = document.querySelector('#nft-create-wrap');
const btnRestart = document.querySelector('#btnRestart');
const nftCompleteWrap = document.querySelector('#nft-complete-wrap');
const notification = document.querySelector('.notification');

let wallet;
let isConnected;

window.addEventListener('load', (event) => {
    wallet = window.suiWallet;

    if (wallet) {
        // Check if wallet permissions have previously been/are still granted
        wallet.hasPermissions().then(res => {
            setConnected(res);
        });
    } else {
        // Sui wallet is not installed
    }
});

btnConnectWallet.addEventListener('click', e => {
    // If the Sui wallet browser extension is not installed, send the user to the download page
    if (typeof isConnected === 'undefined') {
        window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil');
        return;
    }
    
    connectWallet();
});

btnCreate.addEventListener('click', function() {
    this.classList.add('activity');
    createNFT();
});

btnRestart.addEventListener('click', e => {
    document.querySelector('#txtName').value = '';
    document.querySelector('#txtDescription').value = '';
    document.querySelector('#txtURL').value = '';

    nftCreateWrap.classList.remove('d-none');
    nftCompleteWrap.classList.add('d-none');
});

function connectWallet() {
    if (isConnected === true) {
        // Disconnect wallet
        // No way to programatically disconnect from wallet?
        isConnected = false;

    } else if (isConnected === false) {
        // Connect wallet
        wallet.requestPermissions()
        .then(res => {
            // res is boolean
            setConnected(res);
    
            if (!res) {
                // Permission denied by user
                toggleNotification('Wallet permissions denied by user.');
            }
        });
    }
}

function setConnected(connected) {
    // Set the button state to indicate the action that wil be performed when clicked
    isConnected = connected;

    if (connected === true)  {
        btnConnectWallet.innerHTML = 'Wallet connected';
    } else if (connected === false) {
        btnConnectWallet.innerHTML = 'Connect wallet';
    } else {
        btnConnectWallet.innerHTML = 'Get Sui wallet';
    }
}

function createNFT() {
    if (!isConnected) {
        toggleNotification('Error: Wallet not connected.');
        btnCreate.classList.remove('activity');
        return;
    }

    const name = document.querySelector('#txtName').value.trim() || DEFAULT_VALUES.NFT_NAME;
    const desc = document.querySelector('#txtDescription').value.trim() || DEFAULT_VALUES.NFT_DESCRIPTION;
    const url = document.querySelector('#txtURL').value.trim() || DEFAULT_VALUES.NFT_IMAGE_URL;

    suiWallet.executeMoveCall({
        packageObjectId: '0x2',
        module: 'devnet_nft',
        function: 'mint',
        typeArguments: [],
        arguments: [name, desc, url],
        gasBudget: 10000,
    })
    .then(res => {
        const nftID = res?.effects?.created?.[0]?.reference?.objectId;
    
        if (nftID) {
            loadNFT(nftID);
    
            btnCreate.classList.remove('activity');
            nftCreateWrap.classList.add('d-none');
            nftCompleteWrap.classList.remove('d-none');
        }
    })
    .catch(err => {
        // Couldn't create NFT
        toggleNotification('Error: Your NFT could not be minted. Please try again later.');
        btnCreate.classList.remove('activity');
    });
}

function loadNFT(nftID) {
    // This request is copied from https://explorer.devnet.sui.io/. It may not be safe to use
    fetch('https://fullnode.devnet.sui.io/', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({
            "method": "sui_getObject",
            "jsonrpc": "2.0",
            "params": [
                nftID
            ],
            "id": "bd415700-a034-4904-8901-cc634f0f364a"
        })
    })
    .then(res => res.json())
    .then(data => {
        let objectData = data.result.details.data.fields;

        document.querySelector('#nft-details').innerHTML = `
            <div>
                <img class="mb-4" src="${objectData.url}">
                <div class="name">${objectData.name}</div>
                <div class="description">${objectData.description}</div>
                
                <a href="https://explorer.devnet.sui.io/objects/${nftID}" target="_blank" class="btn btn-primary mt-4">View NFT object</a>
            </div>
        `
    })
    .catch(err => {
        // Couldn't load NFT
        toggleNotification('Error: There was a problem loading your NFT. Please try again later.');
        btnCreate.classList.remove('activity');
    });
};

notification.querySelector('.btn').addEventListener('click', e => {
    notification.classList.remove('active');
});

function toggleNotification(message) {
    if (notification.classList.contains('active')) {
        notification.classList.remove('active');
    } else {
        notification.querySelector('.message').innerHTML = message || 'There was an error';
        notification.classList.add('active');
    } 
}