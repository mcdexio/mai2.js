import { ethers } from 'ethers'

import { NetworkIdOrProvider, _ChainIdAndProvider, GovParams, PerpetualStorage, AccountStorage } from './types'
import { SUPPORTED_NETWORK_ID, CONTRACT_READER_ADDRESS, CONTRACT_READER_ABI, SIDE, _0, _1 } from './constants'
import { getChainIdAndProvider, normalizeBigNumberish, getContract, normalizeAddress } from './utils'

export async function getContractReader(
  idOrProvider: NetworkIdOrProvider = SUPPORTED_NETWORK_ID.Mainnet
): Promise<ethers.Contract> {
  const chainIdAndProvider = await getChainIdAndProvider(idOrProvider)
  const address: string = CONTRACT_READER_ADDRESS[chainIdAndProvider.chainId]
  return getContract(address, CONTRACT_READER_ABI, idOrProvider)
}

export async function getGovParams(contractReader: ethers.Contract, perpetualContractAddress: string): Promise<GovParams> {
  const p = await contractReader.getGovParams(perpetualContractAddress)
  return {
    // global
    withdrawalLockBlockCount: parseInt(p.withdrawalLockBlockCount),
    brokerLockBlockCount: parseInt(p.brokerLockBlockCount),

    // perpetual
    intialMargin: normalizeBigNumberish(p.perpetual.initialMarginRate).shiftedBy(-18),
    maintenanceMargin: normalizeBigNumberish(p.perpetual.maintenanceMarginRate).shiftedBy(-18),
    liquidationSafetyFactor: normalizeBigNumberish(p.perpetual.liquidationSafetyFactor).shiftedBy(-18),
    liquidationPenaltyRate: normalizeBigNumberish(p.perpetual.liquidationPenaltyRate).shiftedBy(-18),
    penaltyFundRate: normalizeBigNumberish(p.perpetual.penaltyFundRate).shiftedBy(-18),
    makerDevRate: normalizeBigNumberish(p.perpetual.makerDevFeeRate).shiftedBy(-18),
    takerDevRate: normalizeBigNumberish(p.perpetual.takerDevFeeRate).shiftedBy(-18),

    // amm
    minPoolSize: normalizeBigNumberish(p.automatedMarketMaker.minPoolSize).shiftedBy(-18),
    poolFeeRate: normalizeBigNumberish(p.automatedMarketMaker.poolFeeRate).shiftedBy(-18),
    poolDevFeeRate: normalizeBigNumberish(p.automatedMarketMaker.poolDevFeeRate).shiftedBy(-18),
    emaAlpha: normalizeBigNumberish(p.automatedMarketMaker.emaAlpha).shiftedBy(-18),
    updatePremiumPrize: normalizeBigNumberish(p.automatedMarketMaker.updatePremiumPrize).shiftedBy(-18),
    markPremiumLimit: normalizeBigNumberish(p.automatedMarketMaker.markPremiumLimit).shiftedBy(-18),
    fundingDampener: normalizeBigNumberish(p.automatedMarketMaker.fundingDampener).shiftedBy(-18),
  }
}

export async function getPerpetualStorage(contractReader: ethers.Contract, perpetualContractAddress: string): Promise<PerpetualStorage> {
  const p = await contractReader.getPerpetualStorage(perpetualContractAddress)
  return {
    collateralTokenAddress: normalizeAddress(p.collateralTokenAddress),
    totalSize: normalizeBigNumberish(p.totalSize).shiftedBy(-18),
    longSocialLossPerContract: normalizeBigNumberish(p.longSocialLossPerContract).shiftedBy(-18),
    shortSocialLossPerContract: normalizeBigNumberish(p.shortSocialLossPerContract).shiftedBy(-18),
    isEmergency: p.isEmergency,
    isGlobalSettled: p.isGlobalSettled,
    globalSettlePrice: normalizeBigNumberish(p.globalSettlePrice).shiftedBy(-18),
    fundingParams: {
      accumulatedFundingPerContract: normalizeBigNumberish(p.fundingParams.accumulatedFundingPerContract).shiftedBy(-18),
      lastEMAPremium: normalizeBigNumberish(p.fundingParams.lastEMAPremium).shiftedBy(-18),
      lastPremium: normalizeBigNumberish(p.fundingParams.lastPremium).shiftedBy(-18),
      lastIndexPrice: normalizeBigNumberish(p.fundingParams.lastIndexPrice).shiftedBy(-18),
      lastFundingTimestamp: parseInt(p.fundingParams.lastFundingTime)
    }
  }
}


export async function getAccountStroage(contractReader: ethers.Contract, perpetualContractAddress: string, userAddress: string): Promise<AccountStorage> {
  const p = await contractReader.getAccountStroage(perpetualContractAddress, userAddress)
  return {
    cashBalance: normalizeBigNumberish(p.collateral.balance).shiftedBy(-18),
    withdrawalApplication: {
      amount: normalizeBigNumberish(p.collateral.appliedBalance).shiftedBy(-18),
      height: parseInt(p.collateral.appliedHeight)
    },

    positionSide: p.position.side as SIDE,
    positionSize: normalizeBigNumberish(p.position.size).shiftedBy(-18),
    entryValue: normalizeBigNumberish(p.position.entryValue).shiftedBy(-18),
    entrySocialLoss: normalizeBigNumberish(p.position.entrySocialLoss).shiftedBy(-18),
    entryFundingLoss: normalizeBigNumberish(p.position.entryFundingLoss).shiftedBy(-18)
  }
}
