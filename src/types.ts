import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { SUPPORTED_CHAIN_ID, SIDE } from './constants'

export type BigNumberish = BigNumber | ethers.utils.BigNumber | string | number

//// types for on-chain, submitted, and normalized data
export type ChainIdOrProvider = SUPPORTED_CHAIN_ID | ethers.providers.AsyncSendable | ethers.providers.Provider

// type guard for ChainIdOrProvider
export function isChainId(chainIdOrProvider: ChainIdOrProvider): chainIdOrProvider is SUPPORTED_CHAIN_ID {
  const chainId: SUPPORTED_CHAIN_ID = chainIdOrProvider as SUPPORTED_CHAIN_ID
  return typeof chainId === 'number'
}

// type guard for ChainIdOrProvider
export function isLowLevelProvider(
  chainIdOrProvider: ChainIdOrProvider
): chainIdOrProvider is ethers.providers.AsyncSendable {
  if (isChainId(chainIdOrProvider)) {
    return false
  } else {
    const provider: ethers.providers.Provider = chainIdOrProvider as ethers.providers.Provider
    return !ethers.providers.Provider.isProvider(provider)
  }
}

export interface Token {
  chainId?: SUPPORTED_CHAIN_ID
  address?: string
  decimals: number
}

export interface TokenAmount {
  token: Token
  amount: BigNumberish
}

export interface TokenAmountNormalized {
  token: Token
  amount: BigNumber
}

export interface PerpetualContract {
  contract: ethers.Contract
}

export interface GovParams {
  withdrawalLockBlockCount: number
  brokerLockBlockCount: number
  intialMargin: BigNumber
  maintenanceMargin: BigNumber
  liquidationSafetyFactor: BigNumber
  liquidationPenaltyRate: BigNumber
  penaltyFundRate: BigNumber
  makerDevRate: BigNumber
  takerDevRate: BigNumber
  oracleAddress: string
  markPremiumLimit: BigNumber
  fundingDampener: BigNumber
  minPoolSize: BigNumber
  poolFeePercent: BigNumber
  fairPriceAmount: BigNumber
  fairPriceMaxGap: BigNumber
  emaAlpha: BigNumber
  updatePremiumPrize: BigNumber
}

export interface PerpetualStorage {
  collateralTokenAddress: string
  totalSize: BigNumber
  longSocialLossPerContract: BigNumber
  shortSocialLossPerContract: BigNumber
  isEmergency: boolean
  isGlobalSettled: boolean
  globalSettlePrice: BigNumber
  fundingParams: FundingParams
}

export interface FundingParams {
  accumulatedFundingPerContract: BigNumber
  lastEMAPremium: BigNumber
  lastPremium: BigNumber
  lastIndexPrice: BigNumber
  lastFundingTimestamp: number
}

export interface FundingResult {
  timestamp: number
  accumulatedFundingPerContract: BigNumber
  emaPremium: BigNumber
  markPrice: BigNumber
  premiumRate: BigNumber
  fundingRate: BigNumber
}

export interface AccountStorage {
  cashBalance: BigNumber
  positionSide: SIDE
  positionSize: BigNumber
  entryValue: BigNumber
  entrySocialLoss: BigNumber
  entryFoundingLoss: BigNumber
  withdrawalApplication: WithdrawalApplication
}

export interface WithdrawalApplication {
  amount: BigNumber
  height: number
}

export interface AccountComputed {
  entryPrice: BigNumber
  positionMargin: BigNumber
  maintenanceMargin: BigNumber
  socialLoss: BigNumber
  fundingLoss: BigNumber
  upnl1: BigNumber
  upnl2: BigNumber
  liquidationPrice: BigNumber
  marginBalance: BigNumber
  availableMargin: BigNumber
  withdrawableBalance: BigNumber
  isSafe: boolean
}

export interface AccountDetails {
  accountStorage: AccountStorage
  accountComputed: AccountComputed
}

export interface PoolComputed {
  availableMargin: BigNumber
  impactAskPrice: BigNumber
  impactBidPrice: BigNumber
  fairPrice: BigNumber
}

export interface PoolDetails extends AccountDetails {
  poolComputed: PoolComputed
}

//// internal-only interfaces
export interface _ChainIdAndProvider {
  chainId: number
  provider: ethers.providers.Provider
}
