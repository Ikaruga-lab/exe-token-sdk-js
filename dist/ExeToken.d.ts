import { ethers } from 'ethers';
import { Network } from './Network';
import type { ExeToken, TokenAttributes, TokenCategory } from './Model';
export interface Config {
    networkUrl: string;
    network?: Network;
    localhostTokenAddress?: string;
    signerAddress?: string;
    mintGasLimit?: number;
    callGasLimit?: number;
    timeout?: number;
}
export declare class ExeTokenContract {
    readonly config: Config;
    tokenContract: ethers.Contract;
    constructor(config: Config);
    getToken(tokenId: string): Promise<ExeToken>;
    totalSupply(): Promise<number>;
    getTokenIdsByOwner(ownerAddress: string): Promise<string[]>;
    getTokenIdsByCreator(creatorAddress: string): Promise<string[]>;
    execute(tokenId: string, args?: any[]): Promise<string>;
    test(code: string, args?: any[]): Promise<string>;
    preview(attrs: TokenAttributes, args?: any[]): Promise<ExeToken>;
    mint(attrs: TokenAttributes, categories: TokenCategory[]): Promise<string>;
    getTxHash(tokenId: string): Promise<string>;
    private _decodeTokenUri;
    private get mintGasLimit();
    private get callGasLimit();
}
