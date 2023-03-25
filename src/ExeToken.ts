import { ethers } from 'ethers'
import { base64 } from 'ethers/lib/utils'
import tokenAbi from './ExeToken.json'
import { tokenContractAddresses } from './Addresses'
import { toJSValue } from './JSValue'
import { Network } from './Network'
import type { ExeToken, TokenAttributes, TokenCategory } from './Model'

export interface Config {
  networkUrl: string
  network?: Network 
  localhostTokenAddress?: string
  signerAddress?: string
  mintGasLimit?: number
  callGasLimit?: number
  timeout?: number
}

export class ExeTokenContract {
  tokenContract: ethers.Contract

  constructor(readonly config: Config) {
    const provider = new ethers.providers.JsonRpcProvider({
      url: config.networkUrl,
      timeout: config.timeout || 900000
    })
    const network = config.network ?? Network.ethereum_mainnet
    const tokenAddress = network === Network.ethereum_localhost ?
      config.localhostTokenAddress :
      tokenContractAddresses[network]

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
    try {
      const dataUri = await this.tokenContract.tokenURI(tokenId, { gasLimit: this.callGasLimit })
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
          disabled: true 
        }
      } else {
        throw err
      }
    }
  }

  async totalSupply(): Promise<number> {
    const supply: ethers.BigNumber = await this.tokenContract.totalSupply()
    return supply.toNumber()
  }

  async getTokenIdsByOwner(ownerAddress: string): Promise<string[]> {
    const res = await this.tokenContract.getTokenIdsByCreator(ownerAddress)
    return res.map((id: BigInt) => id.toString())
  } 

  async getTokenIdsByCreator(creatorAddress: string): Promise<string[]> {
    const res = await this.tokenContract.getTokenIdsByCreator(creatorAddress)
    return res.map((id: BigInt) => id.toString())
  }

  async execute(tokenId: string, args: any[]=[]): Promise<string> {
    const argValues = args.map(arg => toJSValue(arg))
    return await this.tokenContract.executeToString(BigInt(tokenId), argValues, { gasLimit: this.callGasLimit })
  }
  async test(code: string, args: any[]=[]): Promise<string> {
    const argValues = args.map(arg => toJSValue(arg))
    return await this.tokenContract.test(code, argValues, { gasLimit: this.callGasLimit })
  }

  async preview(attrs: TokenAttributes, args: any[]=[]): Promise<ExeToken> {
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
      owner: '',
      disabled: false
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
  
  private get callGasLimit(): number {
    return this.config.callGasLimit ?? 30000000
  }
}