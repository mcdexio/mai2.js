import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { SUPPORTED_NETWORK_ID, SIDE } from './constants'

export type BigNumberish = BigNumber | ethers.utils.BigNumber | string | number

export type NetworkIdOrProvider = SUPPORTED_NETWORK_ID | ethers.providers.AsyncSendable | ethers.providers.Provider

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

  // global
  withdrawalLockBlockCount: number
  brokerLockBlockCount: number

  // perpetual
  intialMargin: BigNumber
  maintenanceMargin: BigNumber
  liquidationSafetyFactor: BigNumber
  liquidationPenaltyRate: BigNumber
  penaltyFundRate: BigNumber
  makerDevRate: BigNumber
  takerDevRate: BigNumber

  // amm
  poolFeeRate: BigNumber
  poolDevFeeRate: BigNumber
  emaAlpha: BigNumber
  updatePremiumPrize: BigNumber
  markPremiumLimit: BigNumber
  fundingDampener: BigNumber
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
  entryFundingLoss: BigNumber
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

export interface TransactGas {
  // The maximum units of gas for the transaction to use
  gasLimit: number
  // The price (in wei) per unit of gas
  gasPrice: ethers.utils.BigNumber
}

// export interface AMMTradeResult {
//   price: BigNumber
// }

//// internal-only interfaces
export interface _ChainIdAndProvider {
  chainId: number
  provider: ethers.providers.Provider
}
