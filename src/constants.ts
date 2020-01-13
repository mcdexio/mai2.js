import BigNumber from 'bignumber.js'
import PerpetualABI from './abi/perpetual.json'
import ERC20ABI from './abi/perpetual.json'

export const ETH = 'ETH'
export enum SUPPORTED_CHAIN_ID {
  Mainnet = 1,
  Ropsten = 3
}

export const PERPETUAL_DECIMALS = 18

export const FUNDING_TIME = 28800

export const PERPETUAL_ABI: string = JSON.stringify(PerpetualABI)
export const ERC20_ABI: string = JSON.stringify(ERC20ABI)

export enum SIDE {
  Buy,
  Sell
}

export const _CHAIN_ID_NAME: { [key: number]: string } = {
  [SUPPORTED_CHAIN_ID.Mainnet]: 'homestead',
  [SUPPORTED_CHAIN_ID.Ropsten]: 'ropsten'
}

export const _E = new BigNumber('2.718281828459045235')
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
