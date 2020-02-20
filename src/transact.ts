import { ethers } from 'ethers'
import { SignerOrProvider, GovParams } from './types'
import { PERPETUAL_ABI, AMM_ABI, DECIMALS } from './constants'
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

export async function perpetualSetBroker(
  perpetualContract: ethers.Contract,
  brokerAddress: string,
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  return await perpetualContract.setBroker(brokerAddress, gas)
}

export async function perpetualDeposit(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  return await perpetualContract.deposit(largeAmount.toFixed(), gas)
}

export async function perpetualDepositAndSetBroker(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  brokerAddress: string, // AMM address or an ETH address
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  return await perpetualContract.depositAndSetBroker(largeAmount.toFixed(), brokerAddress, gas)
}

export async function perpetualApplyForWithdrawal(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  return await perpetualContract.applyForWithdrawal(largeAmount.toFixed(), gas)
}

export async function perpetualWithdraw(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  return await perpetualContract.withdraw(largeAmount.toFixed(), gas)
}

export async function ammBuy(
  ammContract: ethers.Contract,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(tradeAmount).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.buy(
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    gas)
}

export async function ammSell(
  ammContract: ethers.Contract,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(tradeAmount).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.sell(
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    gas)
}

export async function ammDepositAndBuy(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(tradeAmount).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.depositAndBuy(
    largeDepositAmount.toFixed(),
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    gas)
}

export async function ammDepositAndSell(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount).shiftedBy(collateralDecimals).dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(tradeAmount).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.depositAndSell(
    largeDepositAmount.toFixed(),
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    gas)
}

export async function ammAddLiquidity(
  ammContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(collateralAmount).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.addLiquidity(
    largeTradeAmount.toFixed(),
    gas)
}

export async function ammRemoveLiquidity(
  ammContract: ethers.Contract,
  shareAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: TransactGas = defaultGas
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(shareAmount).shiftedBy(DECIMALS).dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.removeLiquidity(
    largeTradeAmount.toFixed(),
    gas)
}