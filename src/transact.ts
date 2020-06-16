import { ethers } from 'ethers'
import { SignerOrProvider, GovParams } from './types'
import { PERPETUAL_ABI, AMM_ABI, DECIMALS } from './constants'
import { BigNumberish } from './types'
import { normalizeBigNumberish } from './utils'
import BigNumber from 'bignumber.js'

export async function getPerpetualContract(
  perpetualAddress: string,
  signerOrProvider: SignerOrProvider
): Promise<ethers.Contract> {
  return new ethers.Contract(perpetualAddress, PERPETUAL_ABI, signerOrProvider)
}

export async function getAMMContract(
  ammAddressOrGovParams: string | GovParams,
  signerOrProvider: SignerOrProvider
): Promise<ethers.Contract> {
  let address: string
  if (typeof ammAddressOrGovParams === 'string') {
    address = ammAddressOrGovParams as string
  } else {
    address = (ammAddressOrGovParams as GovParams).amm
  }
  return new ethers.Contract(address, AMM_ABI, signerOrProvider)
}

export async function perpetualDeposit(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await perpetualContract.deposit(largeAmount.toFixed(), gas)
}

export async function perpetualDepositEther(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  gas.value = new ethers.utils.BigNumber(largeAmount.toFixed())
  return await perpetualContract.deposit(largeAmount.toFixed(), gas)
}

export async function perpetualWithdraw(
  perpetualContract: ethers.Contract,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await perpetualContract.withdraw(largeAmount.toFixed(), gas)
}

export async function perpetualSettle(
  perpetualContract: ethers.Contract,
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  return await perpetualContract.settle(gas)
}

export async function ammCreatePool(
  ammContract: ethers.Contract,
  amount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(amount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.createPool(largeAmount.toFixed(), gas)
}

export async function ammBuy(
  ammContract: ethers.Contract,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.buy(largeTradeAmount.toFixed(), largeLimitPrice.toFixed(), deadline, gas)
}

export async function ammSell(
  ammContract: ethers.Contract,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.sell(largeTradeAmount.toFixed(), largeLimitPrice.toFixed(), deadline, gas)
}

export async function ammDepositAndBuy(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.depositAndBuy(
    largeDepositAmount.toFixed(),
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    gas
  )
}

export async function ammDepositEtherAndBuy(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  gas.value = new ethers.utils.BigNumber(largeDepositAmount.toFixed())
  return await ammContract.depositAndBuy(largeDepositAmount.toFixed(), largeTradeAmount.toFixed(), largeLimitPrice.toFixed(), deadline, gas)
}

export async function ammDepositAndSell(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.depositAndSell(
    largeDepositAmount.toFixed(),
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    gas
  )
}

export async function ammDepositEtherAndSell(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  gas.value = new ethers.utils.BigNumber(largeDepositAmount.toFixed())
  return await ammContract.depositAndSell(largeDepositAmount.toFixed(), largeTradeAmount.toFixed(), largeLimitPrice.toFixed(), deadline, gas)
}

export async function ammBuyAndWithdraw(
  ammContract: ethers.Contract,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  withdrawAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeWithdrawAmount = normalizeBigNumberish(withdrawAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.buyAndWithdraw(
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    largeWithdrawAmount.toFixed(),
    gas
  )
}

export async function ammSellAndWithdraw(
  ammContract: ethers.Contract,
  tradeAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  limitPrice: BigNumberish,
  deadline: number, // unix timestamp
  withdrawAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeWithdrawAmount = normalizeBigNumberish(withdrawAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.sellAndWithdraw(
    largeTradeAmount.toFixed(),
    largeLimitPrice.toFixed(),
    deadline,
    largeWithdrawAmount.toFixed(),
    gas
  )
}

export async function ammDepositAndAddLiquidity(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  liquidityAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(liquidityAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.depositAndAddLiquidity(largeDepositAmount.toFixed(), largeTradeAmount.toFixed(), gas)
}

export async function ammDepositEtherAndAddLiquidity(
  ammContract: ethers.Contract,
  depositAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  liquidityAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeDepositAmount = normalizeBigNumberish(depositAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeTradeAmount = normalizeBigNumberish(liquidityAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  gas.value = new ethers.utils.BigNumber(largeDepositAmount.toFixed())
  return await ammContract.depositAndAddLiquidity(largeDepositAmount.toFixed(), largeTradeAmount.toFixed(), gas)
}

export async function ammAddLiquidity(
  ammContract: ethers.Contract,
  amount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(amount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.addLiquidity(largeTradeAmount.toFixed(), gas)
}

export async function ammRemoveLiquidity(
  ammContract: ethers.Contract,
  shareAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  const largeTradeAmount = normalizeBigNumberish(shareAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await ammContract.removeLiquidity(largeTradeAmount.toFixed(), gas)
}

export async function ammSettleShare(
  ammContract: ethers.Contract,
  gas: ethers.providers.TransactionRequest = {}
): Promise<ethers.providers.TransactionResponse> {
  return await ammContract.settleShare(gas)
}

