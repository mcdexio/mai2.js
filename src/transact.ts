/*
import { ethers } from 'ethers'
import { BigNumberish, AMMTradeResult, TransactGas } from './types'

export let defaultGas: TransactGas = {
  gasLimit: 1000000,
  gasPrice: ethers.utils.parseUnits('9.0', 'gwei')
}

export async function perpetualSetBroker(
  contract: ethers.Contact,
  brokerAddress: string,
  gas: TransactGas = defaultGas
): Promise<void> {}

export async function perpetualDeposit(
  contract: ethers.Contract,
  amount: BigNumberish,
  gas: TransactGas = defaultGas
): Promise<void> {}

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
