import { ethers } from 'ethers'

import { GeneralProvider, GovParams, PerpetualStorage, AccountStorage } from './types'
import { SUPPORTED_NETWORK_ID, CONTRACT_READER_ADDRESS, CONTRACT_READER_ABI, SIDE, _0, _1, DECIMALS } from './constants'
import { getNetworkIdAndProvider, normalizeBigNumberish, getContract, normalizeAddress } from './utils'

export async function getContractReader(
  generalProvider: GeneralProvider = SUPPORTED_NETWORK_ID.Mainnet
): Promise<ethers.Contract> {
  const networkIdAndProvider = await getNetworkIdAndProvider(generalProvider)
  const address: string = CONTRACT_READER_ADDRESS[networkIdAndProvider.networkId]
  return getContract(address, CONTRACT_READER_ABI, generalProvider)
}

export async function getGovParams(
  contractReader: ethers.Contract,
  perpetualContractAddress: string
): Promise<GovParams> {
  const p = await contractReader.getGovParams(perpetualContractAddress)
  return {
    // addresses
    amm: p.amm,
    poolAccount: p.poolAccount,

    // perpetual
    initialMargin: normalizeBigNumberish(p.perpGovernanceConfig.initialMarginRate).shiftedBy(-DECIMALS),
    maintenanceMargin: normalizeBigNumberish(p.perpGovernanceConfig.maintenanceMarginRate).shiftedBy(-DECIMALS),
    liquidationPenaltyRate: normalizeBigNumberish(p.perpGovernanceConfig.liquidationPenaltyRate).shiftedBy(-DECIMALS),
    penaltyFundRate: normalizeBigNumberish(p.perpGovernanceConfig.penaltyFundRate).shiftedBy(-DECIMALS),
    makerDevRate: normalizeBigNumberish(p.perpGovernanceConfig.makerDevFeeRate).shiftedBy(-DECIMALS),
    takerDevRate: normalizeBigNumberish(p.perpGovernanceConfig.takerDevFeeRate).shiftedBy(-DECIMALS),
    lotSize: normalizeBigNumberish(p.perpGovernanceConfig.lotSize).shiftedBy(-DECIMALS),
    tradingLotSize: normalizeBigNumberish(p.perpGovernanceConfig.tradingLotSize).shiftedBy(-DECIMALS),

    // amm
    poolFeeRate: normalizeBigNumberish(p.ammGovernanceConfig.poolFeeRate).shiftedBy(-DECIMALS),
    poolDevFeeRate: normalizeBigNumberish(p.ammGovernanceConfig.poolDevFeeRate).shiftedBy(-DECIMALS),
    emaAlpha: normalizeBigNumberish(p.ammGovernanceConfig.emaAlpha).shiftedBy(-DECIMALS),
    updatePremiumPrize: normalizeBigNumberish(p.ammGovernanceConfig.updatePremiumPrize).shiftedBy(-DECIMALS),
    markPremiumLimit: normalizeBigNumberish(p.ammGovernanceConfig.markPremiumLimit).shiftedBy(-DECIMALS),
    fundingDampener: normalizeBigNumberish(p.ammGovernanceConfig.fundingDampener).shiftedBy(-DECIMALS)
  }
}

export async function getPerpetualStorage(
  contractReader: ethers.Contract,
  perpetualContractAddress: string
): Promise<PerpetualStorage> {
  const p = await contractReader.getPerpetualStorage(perpetualContractAddress)
  return {
    collateralTokenAddress: normalizeAddress(p.collateralTokenAddress),
    shareTokenAddress: normalizeAddress(p.shareTokenAddress),
    totalSize: normalizeBigNumberish(p.totalSize).shiftedBy(-DECIMALS),
    longSocialLossPerContract: normalizeBigNumberish(p.longSocialLossPerContract).shiftedBy(-DECIMALS),
    shortSocialLossPerContract: normalizeBigNumberish(p.shortSocialLossPerContract).shiftedBy(-DECIMALS),
    insuranceFundBalance: normalizeBigNumberish(p.insuranceFundBalance).shiftedBy(-DECIMALS),
    isEmergency: p.isEmergency,
    isGlobalSettled: p.isGlobalSettled,
    globalSettlePrice: normalizeBigNumberish(p.globalSettlePrice).shiftedBy(-DECIMALS),
    accumulatedFundingPerContract: normalizeBigNumberish(p.fundingParams.accumulatedFundingPerContract).shiftedBy(
      -DECIMALS
    ),
    lastEMAPremium: normalizeBigNumberish(p.fundingParams.lastEMAPremium).shiftedBy(-DECIMALS),
    lastPremium: normalizeBigNumberish(p.fundingParams.lastPremium).shiftedBy(-DECIMALS),
    lastIndexPrice: normalizeBigNumberish(p.fundingParams.lastIndexPrice).shiftedBy(-DECIMALS),
    lastFundingTimestamp: p.fundingParams.lastFundingTime.toNumber()
  }
}

export async function getAccountStorage(
  contractReader: ethers.Contract,
  perpetualContractAddress: string,
  userAddress: string
): Promise<AccountStorage> {
  const p = await contractReader.getAccountStorage(perpetualContractAddress, userAddress)
  return {
    cashBalance: normalizeBigNumberish(p.collateral.balance).shiftedBy(-DECIMALS),
    positionSide: p.position.side as SIDE,
    positionSize: normalizeBigNumberish(p.position.size).shiftedBy(-DECIMALS),
    entryValue: normalizeBigNumberish(p.position.entryValue).shiftedBy(-DECIMALS),
    entrySocialLoss: normalizeBigNumberish(p.position.entrySocialLoss).shiftedBy(-DECIMALS),
    entryFundingLoss: normalizeBigNumberish(p.position.entryFundingLoss).shiftedBy(-DECIMALS)
  }
}
