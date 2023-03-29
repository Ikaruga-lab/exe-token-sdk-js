import { ethers } from 'ethers';
import { Network } from './Network';
import type { ExeToken, TokenAttributes } from './Model';
export interface Config {
    networkUrl: string;
    network?: Network;
    tokenContractAddress?: string;
    callGasLimit?: number;
    timeout?: number;
}
export declare class ExeTokenContract {
    readonly config: Config;
    tokenContract: ethers.Contract;
    provider: ethers.providers.JsonRpcProvider;
    constructor(config: Config);
    getToken(tokenId: string): Promise<ExeToken>;
    totalSupply(): Promise<number>;
    getTokenIdsByOwner(ownerAddress: string): Promise<string[]>;
    getTokenIdsByCreator(creatorAddress: string): Promise<string[]>;
    execute(tokenId: string, args?: any[]): Promise<string>;
    test(code: string, args?: any[]): Promise<string>;
    preview(attrs: TokenAttributes, args?: any[]): Promise<ExeToken>;
    getTxHash(tokenId: string): Promise<string>;
    private _decodeTokenUri;
    private get callGasLimit();
}
