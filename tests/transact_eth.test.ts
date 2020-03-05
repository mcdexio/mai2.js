import { TransactGas } from '../src/types'
import { getPerpetualContract, getAMMContract } from '../src/transact'
import {
  perpetualDepositEther,
  perpetualDepositEtherAndSetBroker,
} from '../src/transact'
import {
  ammDepositEtherAndBuy,
  ammDepositEtherAndSell,
  ammDepositEtherAndAddLiquidity,
} from '../src/transact'
import { extendExpect } from './helper'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import { testRpc, testUserPK, transactTestAddress } from './eth_address'

const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)
const walletWithProvider = new ethers.Wallet(testUserPK, rpcProvider)
const testGas: TransactGas = { gasLimit: 1234567, gasPrice: new ethers.utils.BigNumber('12345') }

extendExpect()

it('amm.depositAndBuy', async function () {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndBuy(c, depositAmount, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndBuy.zeroDeposit', async function () {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = 0
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndBuy(c, depositAmount, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
})

it('amm.depositAndSell', async function () {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const amount = new BigNumber('1')
  const limitPrice = new BigNumber('0')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndSell(c, depositAmount, amount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndAddLiquidity', async function () {
  const c = await getAMMContract(transactTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammDepositEtherAndAddLiquidity(c, depositAmount, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.depositAndSetBroker', async function () {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualDepositEtherAndSetBroker(c, new BigNumber('2'), transactTestAddress.perpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.deposit', async function () {
  const c = await getPerpetualContract(transactTestAddress.perp, walletWithProvider)
  const tx = await perpetualDepositEther(c, new BigNumber('2'), testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})
