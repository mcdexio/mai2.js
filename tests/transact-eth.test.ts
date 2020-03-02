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

const testRpc = 'http://server10.jy.mcarlo.com:8745'
const testPerp = '0x89C87CeA71967821f4950cDd8034c41aD1c4cDC1'
const testPerpProxy = '0x36432E2fC2d174Dd055903FA6AfEaeb69B2b73f5'
const testAMM = '0x38c2f2E9c2Fc188199eD09c601f753Cf4e8e5bBB'
const testUserPK = '0x1c6a05d6d52954b74407a62f000450d0a748d26a7cc3477cd7f8d7c41d4992ce' // address (2) in our ganache test env
const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)
const walletWithProvider = new ethers.Wallet(testUserPK, rpcProvider)
const testGas: TransactGas = { gasLimit: 1234567, gasPrice: new ethers.utils.BigNumber('12345') }

extendExpect()

it('amm.depositAndBuy', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
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
  const c = await getAMMContract(testAMM, walletWithProvider)
  const depositAmount = 0
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndBuy(c, depositAmount, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
})

it('amm.depositAndSell', async function () {
  const c = await getAMMContract(testAMM, walletWithProvider)
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
  const c = await getAMMContract(testAMM, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammDepositEtherAndAddLiquidity(c, depositAmount, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.depositAndSetBroker', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualDepositEtherAndSetBroker(c, new BigNumber('2'), testPerpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.deposit', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualDepositEther(c, new BigNumber('2'), testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})
