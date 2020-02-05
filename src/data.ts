import { ethers } from 'ethers'

import { NetworkIdOrProvider, _ChainIdAndProvider, GovParams, PerpetualStorage, AccountStorage } from './types'
import { SUPPORTED_NETWORK_ID, CONTRACT_READER_ADDRESS, CONTRACT_READER_ABI, SIDE, _0, _1, DECIMALS } from './constants'
import { getChainIdAndProvider, normalizeBigNumberish, getContract, normalizeAddress } from './utils'

export async function getContractReader(
  idOrProvider: NetworkIdOrProvider = SUPPORTED_NETWORK_ID.Mainnet
): Promise<ethers.Contract> {
  const chainIdAndProvider = await getChainIdAndProvider(idOrProvider)
  const address: string = CONTRACT_READER_ADDRESS[chainIdAndProvider.chainId]
  return getContract(address, CONTRACT_READER_ABI, idOrProvider)
}

export async function getGovParams(
  contractReader: ethers.Contract,
  perpetualContractAddress: string
): Promise<GovParams> {
  const p = await contractReader.getGovParams(perpetualContractAddress)
  return {
    // global
    withdrawalLockBlockCount: parseInt(p.withdrawalLockBlockCount),
    brokerLockBlockCount: parseInt(p.brokerLockBlockCount),

    // perpetual
    intialMargin: normalizeBigNumberish(p.perpetual.initialMarginRate).shiftedBy(-DECIMALS),
    maintenanceMargin: normalizeBigNumberish(p.perpetual.maintenanceMarginRate).shiftedBy(-DECIMALS),
    liquidationSafetyFactor: normalizeBigNumberish(p.perpetual.liquidationSafetyFactor).shiftedBy(-DECIMALS),
    liquidationPenaltyRate: normalizeBigNumberish(p.perpetual.liquidationPenaltyRate).shiftedBy(-DECIMALS),
    penaltyFundRate: normalizeBigNumberish(p.perpetual.penaltyFundRate).shiftedBy(-DECIMALS),
    makerDevRate: normalizeBigNumberish(p.perpetual.makerDevFeeRate).shiftedBy(-DECIMALS),
    takerDevRate: normalizeBigNumberish(p.perpetual.takerDevFeeRate).shiftedBy(-DECIMALS),

    // amm
    poolFeeRate: normalizeBigNumberish(p.automatedMarketMaker.poolFeeRate).shiftedBy(-DECIMALS),
    poolDevFeeRate: normalizeBigNumberish(p.automatedMarketMaker.poolDevFeeRate).shiftedBy(-DECIMALS),
    emaAlpha: normalizeBigNumberish(p.automatedMarketMaker.emaAlpha).shiftedBy(-DECIMALS),
    updatePremiumPrize: normalizeBigNumberish(p.automatedMarketMaker.updatePremiumPrize).shiftedBy(-DECIMALS),
    markPremiumLimit: normalizeBigNumberish(p.automatedMarketMaker.markPremiumLimit).shiftedBy(-DECIMALS),
    fundingDampener: normalizeBigNumberish(p.automatedMarketMaker.fundingDampener).shiftedBy(-DECIMALS)
  }
}

export async function getPerpetualStorage(
  contractReader: ethers.Contract,
  perpetualContractAddress: string
): Promise<PerpetualStorage> {
  const p = await contractReader.getPerpetualStorage(perpetualContractAddress)
  return {
    collateralTokenAddress: normalizeAddress(p.collateralTokenAddress),
    totalSize: normalizeBigNumberish(p.totalSize).shiftedBy(-DECIMALS),
    longSocialLossPerContract: normalizeBigNumberish(p.longSocialLossPerContract).shiftedBy(-DECIMALS),
    shortSocialLossPerContract: normalizeBigNumberish(p.shortSocialLossPerContract).shiftedBy(-DECIMALS),
    isEmergency: p.isEmergency,
    isGlobalSettled: p.isGlobalSettled,
    globalSettlePrice: normalizeBigNumberish(p.globalSettlePrice).shiftedBy(-DECIMALS),
    fundingParams: {
      accumulatedFundingPerContract: normalizeBigNumberish(p.fundingParams.accumulatedFundingPerContract).shiftedBy(
        -DECIMALS
      ),
      lastEMAPremium: normalizeBigNumberish(p.fundingParams.lastEMAPremium).shiftedBy(-DECIMALS),
      lastPremium: normalizeBigNumberish(p.fundingParams.lastPremium).shiftedBy(-DECIMALS),
      lastIndexPrice: normalizeBigNumberish(p.fundingParams.lastIndexPrice).shiftedBy(-DECIMALS),
      lastFundingTimestamp: parseInt(p.fundingParams.lastFundingTime)
    }
  }
}

export async function getAccountStroage(
  contractReader: ethers.Contract,
  perpetualContractAddress: string,
  userAddress: string
): Promise<AccountStorage> {
  const p = await contractReader.getAccountStroage(perpetualContractAddress, userAddress)
  return {
    cashBalance: normalizeBigNumberish(p.collateral.balance).shiftedBy(-DECIMALS),
    withdrawalApplication: {
      amount: normalizeBigNumberish(p.collateral.appliedBalance).shiftedBy(-DECIMALS),
      height: parseInt(p.collateral.appliedHeight)
    },

    positionSide: p.position.side as SIDE,
    positionSize: normalizeBigNumberish(p.position.size).shiftedBy(-DECIMALS),
    entryValue: normalizeBigNumberish(p.position.entryValue).shiftedBy(-DECIMALS),
    entrySocialLoss: normalizeBigNumberish(p.position.entrySocialLoss).shiftedBy(-DECIMALS),
    entryFundingLoss: normalizeBigNumberish(p.position.entryFundingLoss).shiftedBy(-DECIMALS)
  }
}
