import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"
import { SUPPORTED_CHAIN_ID, POSITION_SIDE } from './constants'

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
  withdrawalLockBlockCount: BigNumber
  brokerLockBlockCount: BigNumber
  intialMargin: BigNumber
  maintenanceMargin: BigNumber
  liquidationSafetyFactor: BigNumber
  liquidationPenaltyRate: BigNumber
  penaltyFundRate: BigNumber
  makerFeeRate: BigNumber
  takerFeeRate: BigNumber
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
  collateralTokenAddress: string,
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
  positionSide: POSITION_SIDE
  positionSize: BigNumber
  entryValue: BigNumber
  entrySocialLoss: BigNumber
  entryFoundingLoss: BigNumber
  withdrawalApplication: WithdrawalApplication
}

export interface WithdrawalApplication {
  amount: BigNumber
  height: BigNumber
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

export interface AccountDetails extends AccountStorage, AccountComputed { }


//// internal-only interfaces
export interface _ChainIdAndProvider {
  chainId: number
  provider: ethers.providers.Provider
}
