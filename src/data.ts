import { ethers } from 'ethers'

import { NetworkIdOrProvider, _ChainIdAndProvider, GovParams } from './types'
import { SUPPORTED_NETWORK_ID, CONTRACT_READER_ADDRESS, CONTRACT_READER_ABI, _0, _1 } from './constants'
import { getChainIdAndProvider, normalizeBigNumberish, getContract } from './utils'

export async function getContractReader(
  idOrProvider: NetworkIdOrProvider = SUPPORTED_NETWORK_ID.Mainnet
): Promise<ethers.Contract> {
  const chainIdAndProvider = await getChainIdAndProvider(idOrProvider)
  const address: string = CONTRACT_READER_ADDRESS[chainIdAndProvider.chainId]
  return getContract(address, CONTRACT_READER_ABI, idOrProvider)
}

export async function getGovParams(contractReader: ethers.Contract, perpetualContractAddress: string): Promise<GovParams> {
  const params = await contractReader.getGovParams(perpetualContractAddress)
  console.log("!!!!params", params)
  const p = normalizeBigNumberish(params)
  console.log("!!!!p", p)
  throw 'asdf'
  return {
    withdrawalLockBlockCount: 2,
    brokerLockBlockCount: 2,
    intialMargin: p,
    maintenanceMargin: p,
    liquidationSafetyFactor: p,
    liquidationPenaltyRate: p,
    penaltyFundRate: p,
    makerDevRate: p,
    takerDevRate: p,
    oracleAddress: '',
    markPremiumLimit: p,
    fundingDampener: p,
    ammFeeRate: p,
    emaAlpha: p
  }
}

// export async function getPerpetualStorage(perpetualContract: ethers.Contract): Promise<PerpetualStorage> {
//   const placeholder: ethers.utils.BigNumber = await perpetualContract.placeholder()

//   const p = normalizeBigNumberish(placeholder)
//   return {}
// }


// export async function getAccountStroage(perpetualContract: ethers.Contract, address: string): Promise<AccountStorage> {
//   return {

//   }
// }

