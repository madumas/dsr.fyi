import Web3 from 'web3';

export const sha3 = (str) => {
    return Web3.utils.sha3(str).substring(0,10)
};
export const padsig = (sig) => {
    return sig+'00000000000000000000000000000000000000000000000000000000';
};

export const localeMillion = number =>  (Number(number)/1000000).toLocaleString("en-EN", {maximumFractionDigits: 3});
export const localePrice = number =>  Number(number).toLocaleString("en-EN", {maximumFractionDigits: 2, minimumFractionDigits:2});
export const localeRound = number =>  Number(number).toLocaleString("en-EN", {maximumFractionDigits: 0});

export const fromRad = (value) => {
    const base = Web3.utils.toBN('1000000000000000000000000000000000000000000000');
    return Web3.utils.toBN(value).div(base).toNumber();
};

export const from27 = (value) => {
    return Web3.utils.fromWei(Web3.utils.toBN(value), 'tether');
};
export const fromWei = (value) => {
    return Web3.utils.fromWei(Web3.utils.toBN(value), 'ether');
};

export const decodeDSNote = log => {
    return (new Web3).eth.abi.decodeLog(
        [
            {
                type: 'bytes4',
                name: 'sig',
                indexed: true
            },
            {
                type: 'bytes32',
                name: 'arg1',
                indexed: true
            },
            {
                type: 'bytes32',
                name: 'arg2',
                indexed: true
            },
            {
                type: 'bytes32',
                name: 'arg3',
                indexed: true
            },
            {
                type: 'bytes',
                name: 'data',
                indexed: false
            }
        ],log.data, log.topics);
};

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const numStringToBytes32 = (num) => {
    var bn = Web3.utils.toBN(num).toTwos(256);
    return padToBytes32(bn.toString(16));
};

export const bytes32ToNumString = (bytes32str) => {
    bytes32str = bytes32str.replace(/^0x/, '');
    var bn = Web3.utils.toBN(bytes32str, 16).fromTwos(256);
    return bn.toString();
};

export const padToBytes32 = (n) => {
    while (n.length < 64) {
        n = "0" + n;
    }
    return "0x" + n;
};
