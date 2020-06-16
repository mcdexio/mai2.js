import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { SUPPORTED_NETWORK_ID, SIDE } from './constants'

export type BigNumberish = BigNumber | ethers.utils.BigNumber | string | number

export type GeneralProvider =
  | SUPPORTED_NETWORK_ID
  | ethers.providers.AsyncSendable
  | ethers.providers.Provider
  | NetworkIdAndProvider

export type SignerOrProvider = ethers.Signer | ethers.providers.Provider

export interface PerpetualContract {
  contract: ethers.Contract
}

export interface FundingGovParams {
  markPremiumLimit: BigNumber
  fundingDampener: BigNumber
  emaAlpha: BigNumber
}

export interface GovParams extends FundingGovParams {
  // addresses
  amm: string // AMM contract address
  poolAccount: string // AMM account address

  // perpetual
  initialMargin: BigNumber
  maintenanceMargin: BigNumber
  liquidationPenaltyRate: BigNumber
  penaltyFundRate: BigNumber
  makerDevRate: BigNumber
  takerDevRate: BigNumber
  lotSize: BigNumber
  tradingLotSize: BigNumber

  // amm
  poolFeeRate: BigNumber
  poolDevFeeRate: BigNumber
  emaAlpha: BigNumber
  updatePremiumPrize: BigNumber
  markPremiumLimit: BigNumber
  fundingDampener: BigNumber
}

export interface PerpetualStorage extends FundingParams {
  collateralTokenAddress: string
  shareTokenAddress: string
  totalSize: BigNumber
  longSocialLossPerContract: BigNumber
  shortSocialLossPerContract: BigNumber
  insuranceFundBalance: BigNumber
  isEmergency: boolean
  isGlobalSettled: boolean
  globalSettlePrice: BigNumber
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
  entryFundingLoss: BigNumber
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
  maxWithdrawable: BigNumber
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

export interface TradeCost {
  account: AccountDetails
  marginCost: BigNumber
  fee: BigNumber
}
export interface NetworkIdAndProvider {
  networkId: number
  provider: ethers.providers.Provider
}
