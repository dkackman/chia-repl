// adapted from https://github.com/jm-XCHcentral/Mint-An-NFT/edit/main/src/chichi.js
import crypto from 'crypto';


const ipfsToken = '';  // NFT.storage - https://nft.storage/docs/#get-an-api-token
const walletIndex = 1; // EDIT
const royaltyAddress = ''; // EDIT
const nftAddress = ''; // EDIT
const royaltyPercent = 250; // 2.5%
const walletFingerprint = ''; // EDIT
const fee = '.00000001'; // EDIT
const collectionName = ''; // EDIT
const collectionDescription = ''; // EDIT
const collectionTwitter = ''; // EDIT
const collectionId = ''; // EDIT

var nftImageData;
var nftCID;
var nftURL;
var nftArrayBuffer;
var nftHash;
var metadata;
var metadataCID;
var metadataUrl;
var metadataHash;
var command;

export default async function mintNft() {

}

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}

// Uses browser built-in based crypto library - no plugins - must have up to date Chrome, Firefox or Safari browser for support
// Only Tested on Chrome Version 103.0.5060 (Official Build) (x86_64)
async function digestImage(message) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', message);
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}

var openFile = function (file) {
    var input = file.target;
    var reader = new FileReader();
    reader.onload = function () {
        var dataURL = reader.result;
        var output = document.getElementById('nft-viewer');
        output.src = dataURL;
        nftImageData = input.files[0];
    };
    reader.readAsDataURL(input.files[0]);
    var fileReader = new FileReader();
    fileReader.onload = function (event) {
        nftArrayBuffer = event.target.result;
    };
    fileReader.readAsArrayBuffer(input.files[0]);
};

var uploadtoIPFS = function (event) {
    $.ajax({
        type: 'POST',
        url: 'https://api.nft.storage/upload',
        data: nftImageData,
        contentType: false,
        processData: false,
        headers: {
            'Authorization': 'Bearer ' + ipfsToken,
            'Content-Type': 'image/png'
        },
        success: function (result) {
            nftCID = result.value.cid;
            nftURL = 'https://' + nftCID + '.ipfs.nftstorage.link';
            var alert = document.getElementById('image-alert');
            alert.innerHTML = '<pre>Uploaded image to nft.storage. </pre><a href=\'' + nftURL + '\' target=\'_blank\'>Link: ' + nftCID + '</a>';
            digestImage(nftArrayBuffer).then(digestBuffer => nftHash = digestBuffer);
        },
        error: function (error) {
            console.log('error');
            console.log(error);
        }
    });

};

var generateJson = function (event) {
    var name = document.getElementById('name').value;
    var description = document.getElementById('description').value;
    var sensitiveContent = document.getElementById('sensitive-content').value;
    var isSensitive = false;
    if (sensitiveContent == 'True') {
        isSensitive = true;
    }
    var trait1 = document.getElementById('trait1Value').value;
    var trait2 = document.getElementById('trait2Value').value;
    var trait3 = document.getElementById('trait3Value').value;

    metadata = {
        'format': 'CHIP-0007',
        'name': name,
        'description': description,
        'sensitive_content': isSensitive,
        'collection': {
            'name': collectionName,
            'id': collectionId,
            'attributes': [{
                'type': 'Description',
                'value': collectionDescription
            },
            {
                'type': 'Twitter',
                'value': collectionTwitter
            }
            ]
        },
        /*
           To change attributes per NFT - edit here.
        */
        'attributes': [{
            'trait_type': 'trait-1', // EDIT ME
            'value': trait1
        },
        {
            'trait_type': 'trait-2', // EDIT ME
            'value': trait2
        },
        {
            'trait_type': 'trait-3', // EDIT ME
            'value': trait3
        },
        ]
    };

    var output = document.getElementById('json-viewer');
    output.innerText = JSON.stringify(metadata, null, 2);
};

var uploadJsonIPFS = function (event) {
    $.ajax({
        type: 'POST',
        url: 'https://api.nft.storage/upload',
        data: JSON.stringify(metadata),
        contentType: false,
        processData: false,
        headers: {
            'Authorization': 'Bearer ' + ipfsToken,
            'Content-Type': 'text/plain'
        },
        success: function (result) {
            metadataCID = result.value.cid;
            var alert = document.getElementById('metadata-alert');
            metadataUrl = 'https://' + metadataCID + '.ipfs.nftstorage.link';
            alert.innerHTML = '<pre>Uploaded metadata to nft.storage. </pre><a href=\'' + metadataUrl + '\' target=\'_blank\'>Link: ' + metadataCID + '</a>';
            digestMessage(JSON.stringify(metadata)).then(digestBuffer => metadataHash = digestBuffer);
        },
        error: function (error) {
            console.log('error');
            console.log(error);
        }
    });
};

var generateCliCommand = function (event) {
    command = 'chia wallet nft mint -i ' + walletIndex + ' -ra ' + royaltyAddress + ' -ta ' + nftAddress
        + ' -u ' + nftURL + ' -nh ' + nftHash + ' -rp ' + royaltyPercent + ' -f ' + walletFingerprint +
        ' -mh ' + metadataHash + ' -mu ' + metadataUrl + ' -m ' + fee;

    cliElemnt = document.getElementById('cli-command');
    cliElemnt.innerText = command;
};

var copyCliCommand = function (event) {
    navigator.clipboard.writeText(command);
};
