import BigNumber from 'bignumber.js'
import ContractReaderABI from './abi/ContractReader.json'
import PerpetualABI from './abi/Perpetual.json'
import AMMABI from './abi/AMM.json'

export enum SUPPORTED_NETWORK_ID {
  Mainnet = 1,
  Ropsten = 3,
  S1 = 66,
  S10POA = 1337
}

export const DECIMALS = 18
export const FUNDING_TIME = 28800
export const CONTRACT_READER_ABI: string = JSON.stringify(ContractReaderABI)
export const PERPETUAL_ABI: string = JSON.stringify(PerpetualABI)
export const AMM_ABI: string = JSON.stringify(AMMABI)
export const ETH_COLLATERAL_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum SIDE {
  Flat,
  Sell,
  Buy
}

export enum TRADE_SIDE {
  Buy = SIDE.Buy,
  Sell = SIDE.Sell
}

export const _NETWORK_ID_NAME: { [key: number]: string } = {
  [SUPPORTED_NETWORK_ID.Mainnet]: 'homestead',
  [SUPPORTED_NETWORK_ID.Ropsten]: 'ropsten',
  [SUPPORTED_NETWORK_ID.S1]: 's1',
  [SUPPORTED_NETWORK_ID.S10POA]: 's10poa'
}

export const CONTRACT_READER_ADDRESS: { [key: number]: string } = {
  [SUPPORTED_NETWORK_ID.Mainnet]: '0xEd1051ef1BFaFA9358341517598D225d852C7796',
  [SUPPORTED_NETWORK_ID.Ropsten]: '0x15Ed38e2f35F84C7811116ab7C30B4d5ab0E04B6',
  [SUPPORTED_NETWORK_ID.S1]: '0xe71Be0BA1D77bA933B0e55081D7c62b3239963Be',
  [SUPPORTED_NETWORK_ID.S10POA]: '0x9c45139ac9b6958C8aDD39396585fB7aDd1b5e82'
}

export const _E = new BigNumber('2.718281828459045235')
export const _0_01: BigNumber = new BigNumber('0.01')
export const _0_1: BigNumber = new BigNumber('0.1')
export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _10: BigNumber = new BigNumber('10')
export const _997: BigNumber = new BigNumber('997')
export const _1000: BigNumber = new BigNumber('1000')
export const _10000: BigNumber = new BigNumber('10000')
export const _MAX_UINT8 = 255
export const _MAX_UINT256: BigNumber = new BigNumber(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
)
