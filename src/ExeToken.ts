import { ethers } from 'ethers'
import { base64 } from 'ethers/lib/utils'
import tokenAbi from './ExeToken.json'
import { tokenContractAddresses } from './Addresses'
import { toJSValue } from './JSValue'
import { Network } from './Network'
import type { ExeToken, TokenAttributes } from './Model'

export interface Config {
  networkUrl: string
  network?: Network 
  tokenContractAddress?: string
  callGasLimit?: number
  timeout?: number
  from?: string
}

export class ExeTokenContract {
  tokenContract: ethers.Contract
  provider: ethers.providers.JsonRpcProvider

  constructor(readonly config: Config) {
    const network = config.network ?? Network.ethereum_mainnet
    const tokenAddress = network === Network.ethereum_localhost ?
      config.tokenContractAddress :
      tokenContractAddresses[network]

    if (tokenAddress === undefined || tokenAddress === '') {
      throw new Error('valid networkName or local token contract address is required.')
    }

    this.provider = new ethers.providers.JsonRpcProvider({
      url: config.networkUrl,
      timeout: config.timeout || 900000
    })
    this.tokenContract = new ethers.Contract(
      tokenAddress,
      tokenAbi.abi,
      this.provider
    )
  }

  async getToken(tokenId: string): Promise<ExeToken> {
    try {
      const dataUri = await this.tokenContract.tokenURI(tokenId, { gasLimit: this.callGasLimit, from: this.config.from })
      return this._decodeTokenUri(dataUri, tokenId)
    } catch (err: any) {
      if (err.errorArgs?.length > 0 && err.errorArgs[0] === 'token disabled') {
        return {
          tokenId: tokenId,
          name: '',
          description: '',
          image: '',
          code: '',
          lang: '', 
          creator: '',
          owner: '',
          disabled: true,
          executedCount: 0
        }
      } else {
        throw err
      }
    }
  }

  async totalSupply(): Promise<number> {
    const supply: ethers.BigNumber = await this.tokenContract.totalSupply({ from: this.config.from })
    return supply.toNumber()
  }

  async getTokenIdsByOwner(ownerAddress: string): Promise<string[]> {
    const res = await this.tokenContract.getTokenIdsByOwner(ownerAddress, { from: this.config.from })
    return res.map((id: BigInt) => id.toString())
  } 

  async getTokenIdsByCreator(creatorAddress: string): Promise<string[]> {
    const res = await this.tokenContract.getTokenIdsByCreator(creatorAddress, { from: this.config.from })
    return res.map((id: BigInt) => id.toString())
  }

  async execute(tokenId: string, args: any[]=[]): Promise<string> {
    const argValues = args.map(arg => toJSValue(arg))
    return await this.tokenContract.executeToString(BigInt(tokenId), argValues, { gasLimit: this.callGasLimit, from: this.config.from })
  }
  async test(code: string, args: any[]=[]): Promise<string> {
    const argValues = args.map(arg => toJSValue(arg))
    return await this.tokenContract.test(code, argValues, { gasLimit: this.callGasLimit, from: this.config.from })
  }

  async preview(attrs: TokenAttributes, args: any[]=[]): Promise<ExeToken> {
    const argValues = args.map(arg => toJSValue(arg))
    const dataUri = await this.tokenContract.preview(attrs, args, { gasLimit: this.callGasLimit, from: this.config.from })
    return this._decodeTokenUri(dataUri)
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
      owner: '',
      disabled: false,
      executedCount: 0
    }
    data.attributes.forEach((attr: any) => {
      switch (attr.trait_type) {
        case 'code': token.code = new TextDecoder().decode(base64.decode(attr.value)); break
        case 'lang': token.lang = attr.value; break
        case 'creator': token.creator = attr.value; break
        case 'owner': token.owner = attr.value; break
        case 'executedCount': token.executedCount = +attr.value; break
        default: break
      }
    })
    return token
  }

  private get callGasLimit(): number {
    return this.config.callGasLimit ?? 30000000
  }
}