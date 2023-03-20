import { ethers } from 'ethers'
import { base64 } from 'ethers/lib/utils'
import tokenAbi from './ExeToken.json'
import { tokenContractAddresses } from './Addresses'
import { toJSValue } from './JSValue'
import type { ExeToken, TokenAttributes, TokenCategory } from './Model'

export interface Config {
  networkUrl: string
  networkName?: 'mainnet' | 'goerli' | 'localhost'
  localhostTokenAddress?: string
  signerAddress?: string
  mintGasLimit?: number
  timeout?: number
}

export class ExeTokenContract {
  tokenContract: ethers.Contract

  constructor(readonly config: Config) {
    const provider = new ethers.providers.JsonRpcProvider({
      url: config.networkUrl,
      timeout: config.timeout || 900000
    })
    const networkName = config.networkName ?? 'mainnet' 
    const tokenAddress = networkName === 'localhost' ?
      config.localhostTokenAddress :
      tokenContractAddresses[networkName]

    if (tokenAddress === undefined) {
      throw new Error('valid networkName or local token contract address is required.')
    }

    this.tokenContract = new ethers.Contract(
      tokenAddress,
      tokenAbi.abi,
      config.signerAddress === undefined ? provider : provider.getSigner(config.signerAddress)
    )
  }

  async getToken(tokenId: string): Promise<ExeToken> {
    const dataUri = await this.tokenContract.tokenURI(tokenId, { gasLimit: 300000000 })
    return this._decodeTokenUri(dataUri, tokenId)
  }

  async totalSupply(): Promise<number> {
    const supply: ethers.BigNumber = await this.tokenContract.totalSupply()
    return supply.toNumber()
  }

  async getTokenIdsByCreator(creatorAddress: string): Promise<string[]> {
    const res = await this.tokenContract.getTokenIdsByCreator(creatorAddress)
    return res.map((id: BigInt) => id.toString())
  }

  async execute(tokenId: string, args: any[]): Promise<any> {
    const argValues = args.map(arg => toJSValue(arg))
    const res = await this.tokenContract.executeToString(BigInt(tokenId), argValues, { gasLimit: 300000000 })
    return JSON.parse(res)
  }
  async test(code: string, args: any[]): Promise<string> {
    const argValues = args.map(arg => toJSValue(arg))
    const res = await this.tokenContract.test(code, argValues, { gasLimit: 300000000 })
    return JSON.parse(res)
  }

  async preview(attrs: TokenAttributes, args: any[]): Promise<ExeToken> {
    const argValues = args.map(arg => toJSValue(arg))
    const dataUri = await this.tokenContract.preview(attrs, args)
    return this._decodeTokenUri(dataUri)
  }

  async mint(attrs: TokenAttributes, categories: TokenCategory[]): Promise<string> {
    const transaction = await this.tokenContract.mint(attrs, categories.map(cat => cat.id), { gasLimit: this.mintGasLimit })
    return transaction.hash
  }

  async getTxHash(tokenId: string): Promise<string> {
    const filter = this.tokenContract.filters.Minted(null, +tokenId)
    const evt = await this.tokenContract.queryFilter(filter)
    return evt.length === 1 ? evt[0].transactionHash : ''
  }

  private _decodeTokenUri(uri: string, tokenId?: string): ExeToken {
    const data = JSON.parse(new TextDecoder().decode(base64.decode(uri.split('data:application/json;base64,')[1])))
    const token = {
      tokenId: tokenId,
      name: data.name,
      description: data.description,
      image: data.image,
      code: '',
      lang: '', 
      creator: '',
      owner: ''
    }
    data.attributes.forEach((attr: any) => {
      switch (attr.trait_type) {
        case 'code': token.code = new TextDecoder().decode(base64.decode(attr.value)); break
        case 'lang': token.lang = attr.value; break
        case 'creator': token.creator = attr.value; break
        case 'owner': token.owner = attr.value; break
        default: break
      }
    })
    return token
  }

  private get mintGasLimit(): number {
    return this.config.mintGasLimit ?? 30000000
  }
}