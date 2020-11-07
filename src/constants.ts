import BigNumber from 'bignumber.js'
import AMMABI from './abi/AMM.json'
import ContractReaderABI from './abi/ContractReader.json'
import ExchangeABI from './abi/Exchange.json'
import GlobalConfigABI from './abi/GlobalConfig.json'
import PerpetualABI from './abi/Perpetual.json'

export enum SUPPORTED_NETWORK_ID {
  Mainnet = 1,
  Ropsten = 3,
  S1 = 66,
  S10POA = 1337,
  ArbitrumTestNet = 152709604825713 
}

export const DECIMALS = 18
export const FUNDING_TIME = 28800
export const AMM_ABI: string = JSON.stringify(AMMABI)
export const CONTRACT_READER_ABI: string = JSON.stringify(ContractReaderABI)
export const EXCHANGE_ABI: string = JSON.stringify(ExchangeABI)
export const GLOBAL_CONFIG_ABI: string = JSON.stringify(GlobalConfigABI)
export const PERPETUAL_ABI: string = JSON.stringify(PerpetualABI)
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
  [SUPPORTED_NETWORK_ID.S10POA]: 's10poa',
  [SUPPORTED_NETWORK_ID.ArbitrumTestNet]: 'arbitrum-testnet'
}

export const CONTRACT_READER_ADDRESS: { [key: number]: string } = {
  [SUPPORTED_NETWORK_ID.Mainnet]: '0x53C9Df248150AD849bD1BadD3C83b0f6cb735052',
  [SUPPORTED_NETWORK_ID.Ropsten]: '0x15Ed38e2f35F84C7811116ab7C30B4d5ab0E04B6',
  [SUPPORTED_NETWORK_ID.S1]: '0xe71Be0BA1D77bA933B0e55081D7c62b3239963Be',
  [SUPPORTED_NETWORK_ID.S10POA]: '0xEF73D826c48487523165b0d275de3479b43ab858',
  [SUPPORTED_NETWORK_ID.ArbitrumTestNet]: '0xFBC570bC15Fe1f6F0ad2f490a7baebAe1D05a6eA'
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
