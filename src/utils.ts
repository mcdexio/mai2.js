import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { SUPPORTED_CHAIN_ID, ETH, ERC20_ABI, _CHAIN_ID_NAME, _0, _MAX_UINT8, _MAX_UINT256 } from './constants'
import { BigNumberish, ChainIdOrProvider, isChainId, isLowLevelProvider, Token, _ChainIdAndProvider } from './types'
import { _0_1, _1, _10, _E, DECIMALS } from './constants'



export async function getChainIdAndProvider(chainIdOrProvider: ChainIdOrProvider): Promise<_ChainIdAndProvider> {
  // if a chainId is provided, get a default provider for it
  if (isChainId(chainIdOrProvider)) {
    return {
      chainId: chainIdOrProvider,
      provider: ethers.getDefaultProvider(_CHAIN_ID_NAME[chainIdOrProvider])
    }
  }
  // if a provider is provided, fetch the chainId from it
  else {
    const provider: ethers.providers.Provider = isLowLevelProvider(chainIdOrProvider)
      ? new ethers.providers.Web3Provider(chainIdOrProvider)
      : chainIdOrProvider
    const { chainId }: ethers.utils.Network = await provider.getNetwork()

    if (!(chainId in SUPPORTED_CHAIN_ID)) {
      throw Error(`chainId ${chainId} is not valid.`)
    }

    return {
      chainId,
      provider
    }
  }
}

export async function getContract(address: string, ABI: string, chainIdOrProvider: ChainIdOrProvider = SUPPORTED_CHAIN_ID.Mainnet): Promise<ethers.Contract> {
  const chainIdAndProvider: _ChainIdAndProvider = await getChainIdAndProvider(chainIdOrProvider)
  return new ethers.Contract(address, ABI, chainIdAndProvider.provider)

}

function ensureUInt8(number: number): void {
  if (!Number.isInteger(number) || number < 0 || number > _MAX_UINT8) {
    throw Error(`Passed number '${number}' is not a valid uint8.`)
  }
}

export function ensureAllUInt8(numbers: number[]): void {
  numbers.forEach(ensureUInt8)
}

function ensureUInt256(bigNumber: BigNumber): void {
  if (!bigNumber.isInteger() || bigNumber.isLessThan(_0) || bigNumber.isGreaterThan(_MAX_UINT256)) {
    throw Error(`Passed bigNumber '${bigNumber}' is not a valid uint256.`)
  }
}

export function ensureAllUInt256(bigNumbers: BigNumber[]): void {
  bigNumbers.forEach(ensureUInt256)
}

export function ensureBoundedInteger(number: number, bounds: number | number[]): void {
  const [minimum, maximum]: [number, number] = typeof bounds === 'number' ? [0, bounds] : [bounds[0], bounds[1]]

  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw Error(`Passed number '${number}' is not an integer between '${minimum}' and '${maximum}' (inclusive).`)
  }
}

export function normalizeBigNumberish(bigNumberish: BigNumberish): BigNumber {
  const bigNumber: BigNumber = BigNumber.isBigNumber(bigNumberish)
    ? bigNumberish
    : new BigNumber(bigNumberish.toString())

  if (!bigNumber.isFinite()) {
    throw Error(`Passed bigNumberish '${bigNumberish}' of type '${typeof bigNumberish}' is not valid.`)
  }

  return bigNumber
}

export function normalizeAddress(address: string): string {
  return ethers.utils.getAddress(address.toLowerCase())
}

export function getEthToken(chainId?: number): Token {
  return {
    ...(chainId ? { chainId } : {}),
    address: ETH,
    decimals: 18
  }
}

export async function getToken(tokenAddress: string, chainIdAndProvider: _ChainIdAndProvider): Promise<Token> {
  if (tokenAddress === ETH) {
    return getEthToken(chainIdAndProvider.chainId)
  } else {
    const ERC20Contract = await getContract(tokenAddress, ERC20_ABI, chainIdAndProvider.provider)
    const decimals: number = await ERC20Contract.decimals()

    return {
      chainId: chainIdAndProvider.chainId,
      address: ERC20Contract.address,
      decimals
    }
  }
}



const _LN_1_5 = new BigNumber('0.405465108108164381978013115464349137')
const _LN_10 = new BigNumber('2.302585092994045684017991454684364208')

export function bigLn(v: BigNumber): BigNumber {
  if (v.isNegative()) {
    throw Error(`logE of negative number '${v}'`)
  }
  if (v.isGreaterThan('10000000000000000000000000000000000000000')) {
    throw Error(`logE only accepts v <= 1e22 * 1e18`)
  }
  let x = v
  let r = _0

  while (x.isLessThanOrEqualTo(_0_1)) {
    x = x.times(_10)
    r = r.minus(_LN_10)
  }
  while (x.isGreaterThanOrEqualTo(_10)) {
    x = x.div(_10)
    r = r.plus(_LN_10)
  }
  while (x.isLessThan(_1)) {
    x = x.times(_E)
    r = r.minus(_1)
  }
  while (x.isGreaterThan(_E)) {
    x = x.div(_E)
    r = r.plus(_1)
  }
  if (x.isEqualTo(_1)) {
    return r.dp(DECIMALS)
  }
  if (x.isEqualTo(_E)) {
    return _1.plus(r.dp(DECIMALS))
  }

  //                    2    x           2    x          2    x
  // Ln(a+x) = Ln(a) + ---(------)^1  + ---(------)^3 + ---(------)^5 + ...
  //                    1   2a+x         3   2a+x        5   2a+x
  // Let x = v - a
  //                  2   v-a         2   v-a        2   v-a
  // Ln(v) = Ln(a) + ---(-----)^1  + ---(-----)^3 + ---(-----)^5 + ...
  //                  1   v+a         3   v+a        5   v+a
  r = r.plus(_LN_1_5)
  const a1_5 = new BigNumber(1.5)
  let m = _1.times(x.minus(a1_5).div(x.plus(a1_5)))
  r = r.plus(m.times(2))
  const m2 = m.times(m)
  let i = 3
  while (true) {
    m = m.times(m2)
    r = r.plus(m.times(2).div(i))
    i += 2
    if (i >= 3 + 2 * DECIMALS) {
      break
    }
  }
  return r.dp(DECIMALS)
}

export function bigLog(base: BigNumber, x: BigNumber): BigNumber {
  return bigLn(x).div(bigLn(base))
}
