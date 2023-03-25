export interface ExeToken {
  tokenId?: string
  code: string
  lang: string
  name: string
  description: string
  image: string
  creator: string
  owner: string
  disabled: boolean
}

export interface TokenAttributes {
  creator: string
  code: string
  lang: string
  name: string
  description: string
  content: string
  contentColor: string
  contentOpacity: string
  backgroundColor: string
  contentOffsetX: number
  contentOffsetY: number
}

export interface TokenCategory {
  name: string
  id: number
  disabled: boolean 
}