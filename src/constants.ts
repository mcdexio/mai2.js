import BigNumber from 'bignumber.js'
import ERC20ABI from './abi/erc20.json'
import ContractReaderABI from './abi/ContractReader.json'
import PerpetualABI from './abi/Perpetual.json'
import AMMABI from './abi/AMM.json'

export const ETH = 'ETH'
export enum SUPPORTED_NETWORK_ID {
  Mainnet = 1,
  Ropsten = 3,
  S1 = 66
}

export const DECIMALS = 18
export const FUNDING_TIME = 28800
export const CONTRACT_READER_ABI: string = JSON.stringify(ContractReaderABI)
export const PERPETUAL_ABI: string = JSON.stringify(PerpetualABI)
export const AMM_ABI: string = JSON.stringify(AMMABI)
export const ERC20_ABI: string = JSON.stringify(ERC20ABI)

export enum SIDE {
  Buy,
  Sell,
  Flat
}

export enum TRADE_SIDE {
  Buy = SIDE.Buy,
  Sell = SIDE.Sell
}

export const _NETWORK_ID_NAME: { [key: number]: string } = {
  [SUPPORTED_NETWORK_ID.Mainnet]: 'homestead',
  [SUPPORTED_NETWORK_ID.Ropsten]: 'ropsten',
  [SUPPORTED_NETWORK_ID.S1]: 's1'
}

export const CONTRACT_READER_ADDRESS: { [key: number]: string } = {
  [SUPPORTED_NETWORK_ID.S1]: '0xA617Ec1F68766EEa619cD72d93067064D2765d39'
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
