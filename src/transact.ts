import { ethers } from 'ethers'
import { SignerOrProvider, GovParams } from './types'
import { PERPETUAL_ABI, AMM_ABI } from './constants'
import { BigNumberish, TransactGas } from './types'
import { normalizeBigNumberish } from '../src/utils'
import BigNumber from 'bignumber.js'

export let defaultGas: TransactGas = {
  gasLimit: 1000000,
  gasPrice: ethers.utils.parseUnits('9.0', 'gwei')
}

export async function getPerpetualContract(perpetualAddress: string, signerOrProvider: SignerOrProvider): Promise<ethers.Contract> {
  return new ethers.Contract(perpetualAddress, PERPETUAL_ABI, signerOrProvider)
}

export async function getAMMContract(ammAddressOrGovParams: string | GovParams, signerOrProvider: SignerOrProvider): Promise<ethers.Contract> {
  let address: string
  if (typeof ammAddressOrGovParams === 'string') {
    address = ammAddressOrGovParams as string
  } else {
    address = (ammAddressOrGovParams as GovParams).amm
  }
  return new ethers.Contract(address, AMM_ABI, signerOrProvider)
}

/*
export async function perpetualSetBroker(
contract: ethers.Contract,
brokerAddress: string,
gas: TransactGas = defaultGas
): Promise<void> {}
*/
export async function perpetualDeposit(
  contract: ethers.Contract,
  amount: BigNumberish, // should be decimals (ie: 1.234)
  collateralDecimals: number,
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(amount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  return await contract.deposit(largeAmount.toString(), gas)
}
/*
export async function perpetualApplyWithdrawal(
contract: ethers.Contract,
amount: BigNumberish,
gas: TransactGas = defaultGas
): Promise<void> {}

export async function perpetualWithdrawal(
contract: ethers.Contract,
amount: BigNumberish,
gas: TransactGas = defaultGas
): Promise<void> {}

export async function ammBuy(
contract: ethers.Contract,
amount: BigNumberish,
limitPrice: BigNumberish,
deadline: number,
gas: TransactGas = defaultGas
): Promise<AMMTradeResult> {}

export async function ammSell(
contract: ethers.Contract,
amount: BigNumberish,
limitPrice: BigNumberish,
deadline: number,
gas: TransactGas = defaultGas
): Promise<AMMTradeResult> {}

export async function ammDepositAndBuy(
contract: ethers.Contract,
amount: BigNumberish,
leverage: BigNumberish,
limitPrice: BigNumberish,
deadline: number,
gas: TransactGas = defaultGas
): Promise<AMMTradeResult> {}

export async function ammDepositAndSell(
contract: ethers.Contract,
amount: BigNumberish,
leverage: BigNumberish,
limitPrice: BigNumberish,
deadline: number,
gas: TransactGas = defaultGas
): Promise<AMMTradeResult> {}

export async function ammAddLiquidity(
contract: ethers.Contract,
collateralAmount: BigNumberish,
gas: TransactGas = defaultGas
)

export async function ammRemoveLiquidity(
contract: ethers.Contract,
shareAmount: BigNumberish,
gas: TransactGas = defaultGas
)

export async function ammDepositAndAddLiquidity(
contract: ethers.Contract,
collateralAmount: BigNumberish,
gas: TransactGas = defaultGas
)

*/
