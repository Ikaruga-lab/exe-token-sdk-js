"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExeTokenContract = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const ExeToken_json_1 = __importDefault(require("./ExeToken.json"));
const Addresses_1 = require("./Addresses");
const JSValue_1 = require("./JSValue");
class ExeTokenContract {
    constructor(config) {
        this.config = config;
        const provider = new ethers_1.ethers.providers.JsonRpcProvider({
            url: config.networkUrl,
            timeout: config.timeout || 900000
        });
        const networkName = config.networkName ?? 'mainnet';
        const tokenAddress = networkName === 'localhost' ?
            config.localhostTokenAddress :
            Addresses_1.tokenContractAddresses[networkName];
        if (tokenAddress === undefined) {
            throw new Error('valid networkName or local token contract address is required.');
        }
        this.tokenContract = new ethers_1.ethers.Contract(tokenAddress, ExeToken_json_1.default.abi, config.signerAddress === undefined ? provider : provider.getSigner(config.signerAddress));
    }
    async getToken(tokenId) {
        const dataUri = await this.tokenContract.tokenURI(tokenId, { gasLimit: 300000000 });
        return this._decodeTokenUri(dataUri, tokenId);
    }
    async totalSupply() {
        const supply = await this.tokenContract.totalSupply();
        return supply.toNumber();
    }
    async getTokenIdsByCreator(creatorAddress) {
        const res = await this.tokenContract.getTokenIdsByCreator(creatorAddress);
        return res.map((id) => id.toString());
    }
    async execute(tokenId, args) {
        const argValues = args.map(arg => (0, JSValue_1.toJSValue)(arg));
        const res = await this.tokenContract.executeToString(BigInt(tokenId), argValues, { gasLimit: 300000000 });
        return JSON.parse(res);
    }
    async test(code, args) {
        const argValues = args.map(arg => (0, JSValue_1.toJSValue)(arg));
        const res = await this.tokenContract.test(code, argValues, { gasLimit: 300000000 });
        return JSON.parse(res);
    }
    async preview(attrs, args) {
        const argValues = args.map(arg => (0, JSValue_1.toJSValue)(arg));
        const dataUri = await this.tokenContract.preview(attrs, args);
        return this._decodeTokenUri(dataUri);
    }
    async mint(attrs, categories) {
        const transaction = await this.tokenContract.mint(attrs, categories.map(cat => cat.id), { gasLimit: this.mintGasLimit });
        return transaction.hash;
    }
    async getTxHash(tokenId) {
        const filter = this.tokenContract.filters.Minted(null, +tokenId);
        const evt = await this.tokenContract.queryFilter(filter);
        return evt.length === 1 ? evt[0].transactionHash : '';
    }
    _decodeTokenUri(uri, tokenId) {
        const data = JSON.parse(new TextDecoder().decode(utils_1.base64.decode(uri.split('data:application/json;base64,')[1])));
        const token = {
            tokenId: tokenId,
            name: data.name,
            description: data.description,
            image: data.image,
            code: '',
            lang: '',
            creator: '',
            owner: ''
        };
        data.attributes.forEach((attr) => {
            switch (attr.trait_type) {
                case 'code':
                    token.code = new TextDecoder().decode(utils_1.base64.decode(attr.value));
                    break;
                case 'lang':
                    token.lang = attr.value;
                    break;
                case 'creator':
                    token.creator = attr.value;
                    break;
                case 'owner':
                    token.owner = attr.value;
                    break;
                default: break;
            }
        });
        return token;
    }
    get mintGasLimit() {
        return this.config.mintGasLimit ?? 30000000;
    }
}
exports.ExeTokenContract = ExeTokenContract;