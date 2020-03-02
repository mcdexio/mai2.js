import { getContractReader, getGovParams } from '../src/data'
import { TransactGas } from '../src/types'
import { getPerpetualContract, getAMMContract } from '../src/transact'
import {
  perpetualSetBroker,
  perpetualDeposit,
  perpetualDepositAndSetBroker,
  perpetualApplyForWithdrawal,
  perpetualWithdraw
} from '../src/transact'
import {
  ammDepositAndBuy,
  ammDepositAndSell,
  ammDepositAndAddLiquidity,
  ammBuy,
  ammSell,
  ammAddLiquidity,
  ammRemoveLiquidity
} from '../src/transact'
import { extendExpect } from './helper'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'

const testRpc = 'http://server10.jy.mcarlo.com:8745'
const testPerp = '0xdd22dF8d692f9e4727A2a5a8Ed1C2d1354793389'
const testPerpProxy = '0xF070E6C301C9Cd082d136Ef8d8C8ff4915fB7ADe'
const testAMM = '0xb5220f24124A6D43CB0EF360236bd10Ba4170e94'
const testUserPK = '0x1c6a05d6d52954b74407a62f000450d0a748d26a7cc3477cd7f8d7c41d4992ce' // address (2) in our ganache test env
const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)
const walletWithProvider = new ethers.Wallet(testUserPK, rpcProvider)
const testGas: TransactGas = { gasLimit: 1234567, gasPrice: new ethers.utils.BigNumber('12345') }

extendExpect()

it('perp.applyForWithdrawal', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualApplyForWithdrawal(c, new BigNumber('1'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.setBroker', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualSetBroker(c, testPerpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.deposit', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualDeposit(c, new BigNumber('2'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.depositAndSetBroker', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualDepositAndSetBroker(c, new BigNumber('2'), 18, testPerpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('get AMM by GovParams', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const govParams = await getGovParams(contractReader, testPerp)
  const c = await getAMMContract(govParams, walletWithProvider)
  expect(c.address).toEqual(testAMM)
})

it('amm.depositAndBuy', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositAndBuy(c, depositAmount, 18, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndBuy.zeroDeposit', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const depositAmount = 0
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositAndBuy(c, depositAmount, 18, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
})

it('amm.depositAndSell', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const amount = new BigNumber('1')
  const limitPrice = new BigNumber('0')
  const deadLine = 9999999999
  const tx = await ammDepositAndSell(c, depositAmount, 18, amount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndAddLiquidity', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammDepositAndAddLiquidity(c, depositAmount, 18, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.buy', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammBuy(c, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.sell', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('0')
  const deadLine = 9999999999
  const tx = await ammSell(c, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.addLiquidity', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammAddLiquidity(c, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.removeLiquidity', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
  const shareAmount = new BigNumber('2')
  const tx = await ammRemoveLiquidity(c, shareAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.withdraw', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualWithdraw(c, new BigNumber('1'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})
