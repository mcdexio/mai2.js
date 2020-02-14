import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { SUPPORTED_NETWORK_ID, _NETWORK_ID_NAME, ETH_COLLATERAL_ADDRESS } from './constants'
import { BigNumberish, GeneralProvider, NetworkIdAndProvider } from './types'
import { _MAX_UINT8, _MAX_UINT256, _0, _0_1, _1, _10, _E, DECIMALS } from './constants'

export function isNetworkId(generalProvider: GeneralProvider): generalProvider is SUPPORTED_NETWORK_ID {
  const chainId: SUPPORTED_NETWORK_ID = generalProvider as SUPPORTED_NETWORK_ID
  return typeof chainId === 'number'
}

export function isLowLevelProvider(
  generalProvider: GeneralProvider
): generalProvider is ethers.providers.AsyncSendable {
  if (isNetworkId(generalProvider)) {
    return false
  }
  const provider: ethers.providers.Provider = generalProvider as ethers.providers.Provider
  return !ethers.providers.Provider.isProvider(provider)
}

export function isNetworkIdAndProvider(generalProvider: GeneralProvider): generalProvider is NetworkIdAndProvider {
  const networkIdAndProvider: NetworkIdAndProvider = generalProvider as NetworkIdAndProvider
  return (
    typeof networkIdAndProvider.networkId === 'number' &&
    ethers.providers.Provider.isProvider(networkIdAndProvider.provider)
  )
}

export async function getChainIdAndProvider(generalProvider: GeneralProvider): Promise<NetworkIdAndProvider> {
  if (isNetworkIdAndProvider(generalProvider)) {
    return generalProvider
  } else if (isNetworkId(generalProvider)) {
    // if a id is provided, get a default provider for it
    if (!(generalProvider in SUPPORTED_NETWORK_ID)) {
      throw Error(`chainId ${generalProvider} is not valid.`)
    }
    return {
      networkId: generalProvider,
      provider: ethers.getDefaultProvider(_NETWORK_ID_NAME[generalProvider])
    }
  } else {
    // if a provider is provided, fetch the chainId from it
    const provider: ethers.providers.Provider = isLowLevelProvider(generalProvider)
      ? new ethers.providers.Web3Provider(generalProvider)
      : generalProvider
    const { chainId }: ethers.utils.Network = await provider.getNetwork()
    if (!(chainId in SUPPORTED_NETWORK_ID)) {
      throw Error(`chainId ${chainId} is not valid.`)
    }

    return {
      networkId: chainId,
      provider
    }
  }
}

export async function getContract(
  address: string,
  ABI: string,
  generalProvider: GeneralProvider = SUPPORTED_NETWORK_ID.Mainnet
): Promise<ethers.Contract> {
  const networkIdAndProvider: NetworkIdAndProvider = await getChainIdAndProvider(generalProvider)
  return new ethers.Contract(address, ABI, networkIdAndProvider.provider)
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

export function isCollateralETH(tokenAddress: string): boolean {
  return tokenAddress === ETH_COLLATERAL_ADDRESS
}
