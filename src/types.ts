import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { SUPPORTED_CHAIN_ID, SIDE } from './constants'

export type BigNumberish = BigNumber | ethers.utils.BigNumber | string | number

//// types for on-chain, submitted, and normalized data
export type ChainIdOrProvider = SUPPORTED_CHAIN_ID | ethers.providers.AsyncSendable | ethers.providers.Provider

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

export interface FundingGovParams {
  markPremiumLimit: BigNumber
  fundingDampener: BigNumber
  emaAlpha: BigNumber
}

export interface GovParams extends FundingGovParams {
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
  ammFeeRate: BigNumber
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
  positionValue: BigNumber
  positionMargin: BigNumber
  maintenanceMargin: BigNumber
  socialLoss: BigNumber
  fundingLoss: BigNumber
  pnl1: BigNumber
  pnl2: BigNumber
  roe: BigNumber
  liquidationPrice: BigNumber
  marginBalance: BigNumber
  availableMargin: BigNumber
  withdrawableBalance: BigNumber
  leverage: BigNumber
  isSafe: boolean
  inverseSide: SIDE
  inverseEntryPrice: BigNumber
  inverseLiquidationPrice: BigNumber
}

export interface AccountDetails {
  accountStorage: AccountStorage
  accountComputed: AccountComputed
}

export interface AMMComputed {
  availableMargin: BigNumber
  fairPrice: BigNumber
  inverseFairPrice: BigNumber
}

export interface AMMDetails extends AccountDetails {
  ammComputed: AMMComputed
}

export interface Depth {
  price: BigNumber
  amount: BigNumber
}

export interface AMMDepth {
  bids: Array<Depth>
  asks: Array<Depth>
}

//// internal-only interfaces
export interface _ChainIdAndProvider {
  chainId: number
  provider: ethers.providers.Provider
}
