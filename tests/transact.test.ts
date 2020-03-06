import { getContractReader, getGovParams } from '../src/data'
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
import { testRpc, testUserPK, transactTestAddress } from './eth_address'
import { mintTestToken, createPoolForTestToken, approvePerp, isPoolEmpty } from './init_env'
import { testAdmin, testU2, testU7, testContractReader } from './eth_address'
import { CONTRACT_READER_ADDRESS, SUPPORTED_NETWORK_ID } from '../src/constants'

const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)
const walletWithProvider = new ethers.Wallet(testUserPK, rpcProvider)
const testGas: ethers.providers.TransactionRequest = {
  gasLimit: 1234567,
  gasPrice: new ethers.utils.BigNumber('12345')
}

extendExpect()

beforeAll(async done => {
  if (await isPoolEmpty(transactTestAddress, rpcProvider)) {
    console.log('> initializing transactTestAddress')
    await mintTestToken(transactTestAddress, testAdmin, rpcProvider)
    await createPoolForTestToken(transactTestAddress, testU7, rpcProvider)
    await approvePerp(transactTestAddress, testU2, rpcProvider)
    console.log('> initializing transactTestAddress done')
  } else {
    console.log('> already initialized')
  }

  CONTRACT_READER_ADDRESS[SUPPORTED_NETWORK_ID.S1] = testContractReader
  done()
})

it('perp.applyForWithdrawal', async function() {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualApplyForWithdrawal(c, new BigNumber('1'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.setBroker', async function() {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualSetBroker(c, transactTestAddress.perpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.deposit', async function() {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualDeposit(c, new BigNumber('2'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.depositAndSetBroker', async function() {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualDepositAndSetBroker(c, new BigNumber('2'), 18, transactTestAddress.perpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('get AMM by GovParams', async function() {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const govParams = await getGovParams(contractReader, transactTestAddress.perp)
  const c = await getAMMContract(govParams, walletWithProvider)
  expect(c.address).toEqual(transactTestAddress.amm)
})

it('amm.depositAndBuy', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositAndBuy(c, depositAmount, 18, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndBuy.zeroDeposit', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = 0
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositAndBuy(c, depositAmount, 18, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndSell', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const amount = new BigNumber('1')
  const limitPrice = new BigNumber('0')
  const deadLine = 9999999999
  const tx = await ammDepositAndSell(c, depositAmount, 18, amount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndAddLiquidity', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammDepositAndAddLiquidity(c, depositAmount, 18, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.buy', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammBuy(c, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.sell', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('0')
  const deadLine = 9999999999
  const tx = await ammSell(c, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.addLiquidity', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammAddLiquidity(c, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.removeLiquidity', async function() {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const shareAmount = new BigNumber('2')
  const tx = await ammRemoveLiquidity(c, shareAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.withdraw', async function() {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualWithdraw(c, new BigNumber('1'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})
