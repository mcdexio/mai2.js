import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { SUPPORTED_NETWORK_ID, _NETWORK_ID_NAME } from './constants'
import { BigNumberish, NetworkIdOrProvider, _ChainIdAndProvider } from './types'
import { _MAX_UINT8, _MAX_UINT256, _0, _0_1, _1, _10, _E, DECIMALS } from './constants'

export function isNetworkId(idOrProvider: NetworkIdOrProvider): idOrProvider is SUPPORTED_NETWORK_ID {
  const chainId: SUPPORTED_NETWORK_ID = idOrProvider as SUPPORTED_NETWORK_ID
  return typeof chainId === 'number'
}

export function isLowLevelProvider(idOrProvider: NetworkIdOrProvider): idOrProvider is ethers.providers.AsyncSendable {
  if (isNetworkId(idOrProvider)) {
    return false
  }
  const provider: ethers.providers.Provider = idOrProvider as ethers.providers.Provider
  return !ethers.providers.Provider.isProvider(provider)
}

export async function getChainIdAndProvider(idOrProvider: NetworkIdOrProvider): Promise<_ChainIdAndProvider> {
  // if a id is provided, get a default provider for it
  if (isNetworkId(idOrProvider)) {
    if (!(idOrProvider in SUPPORTED_NETWORK_ID)) {
      throw Error(`chainId ${idOrProvider} is not valid.`)
    }
    return {
      chainId: idOrProvider,
      provider: ethers.getDefaultProvider(_NETWORK_ID_NAME[idOrProvider])
    }
  } else {
    // if a provider is provided, fetch the chainId from it
    const provider: ethers.providers.Provider = isLowLevelProvider(idOrProvider)
      ? new ethers.providers.Web3Provider(idOrProvider)
      : idOrProvider
    const { chainId }: ethers.utils.Network = await provider.getNetwork()
    if (!(chainId in SUPPORTED_NETWORK_ID)) {
      throw Error(`chainId ${chainId} is not valid.`)
    }

    return {
      chainId,
      provider
    }
  }
}

export async function getContract(
  address: string,
  ABI: string,
  idOrProvider: NetworkIdOrProvider = SUPPORTED_NETWORK_ID.Mainnet
): Promise<ethers.Contract> {
  const chainIdAndProvider: _ChainIdAndProvider = await getChainIdAndProvider(idOrProvider)
  return new ethers.Contract(address, ABI, chainIdAndProvider.provider)
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

export function bigPowi(x: BigNumber, n: BigNumber): BigNumber {
  if (!n.isInteger()) {
    throw Error(`bad n(${n}), must be integer`)
  }
  let z = n.mod(2).isZero() ? _1 : x
  n = n.div(2).dp(0, BigNumber.ROUND_DOWN)
  while (!n.isZero()) {
    x = x.times(x).dp(DECIMALS, BigNumber.ROUND_DOWN)
    if (!n.mod(2).isZero()) {
      z = z.times(x).dp(DECIMALS, BigNumber.ROUND_DOWN)
    }
    n = n.div(2).dp(0, BigNumber.ROUND_DOWN)
  }
  return z
}
