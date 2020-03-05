import { getPerpetualContract, getAMMContract } from '../src/transact'
import { perpetualDepositEther, perpetualDepositEtherAndSetBroker } from '../src/transact'
import { ammDepositEtherAndBuy, ammDepositEtherAndSell, ammDepositEtherAndAddLiquidity } from '../src/transact'
import { extendExpect } from './helper'
import { ethers } from 'ethers'

import BigNumber from 'bignumber.js'

import { testRpc, testUserPK, transactEthTestAddress } from './eth_address'
import { createPoolForETH, isPoolEmpty } from './init_env'
import { testU7, testContractReader } from './eth_address'
import { CONTRACT_READER_ADDRESS, SUPPORTED_NETWORK_ID } from '../src/constants'

const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)
const walletWithProvider = new ethers.Wallet(testUserPK, rpcProvider)
const testGas: ethers.providers.TransactionRequest = {
  gasLimit: 1234567,
  gasPrice: new ethers.utils.BigNumber('12345')
}

extendExpect()

beforeAll(async () => {
  if (await isPoolEmpty(transactEthTestAddress, rpcProvider)) {
    console.log('   > initializing transactEthTestAddress')
    await createPoolForETH(transactEthTestAddress, testU7, rpcProvider)
    console.log('> initializing transactEthTestAddress done')
  } else {
    console.log('> already initialized')
  }
  CONTRACT_READER_ADDRESS[SUPPORTED_NETWORK_ID.S1] = testContractReader
})

it('amm.depositAndBuy', async function() {
  const c = await getAMMContract(transactEthTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndBuy(c, depositAmount, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndBuy.zeroDeposit', async function() {
  const c = await getAMMContract(transactEthTestAddress.amm, walletWithProvider)
  const depositAmount = 0
  const buyAmount = new BigNumber('1')
  const limitPrice = new BigNumber('1')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndBuy(c, depositAmount, buyAmount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
})

it('amm.depositAndSell', async function() {
  const c = await getAMMContract(transactEthTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const amount = new BigNumber('1')
  const limitPrice = new BigNumber('0')
  const deadLine = 9999999999
  const tx = await ammDepositEtherAndSell(c, depositAmount, amount, limitPrice, deadLine, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('amm.depositAndAddLiquidity', async function() {
  const c = await getAMMContract(transactEthTestAddress.amm, walletWithProvider)
  const depositAmount = new BigNumber('0.005') // 1 / 200
  const collateralAmount = new BigNumber('0.1')
  const tx = await ammDepositEtherAndAddLiquidity(c, depositAmount, collateralAmount, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.depositAndSetBroker', async function() {
  const c = await getPerpetualContract(transactEthTestAddress.perp, walletWithProvider)
  const tx = await perpetualDepositEtherAndSetBroker(c, new BigNumber('2'), transactEthTestAddress.perpProxy, testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})

it('perp.deposit', async function() {
  const c = await getPerpetualContract(transactEthTestAddress.perp, walletWithProvider)
  const tx = await perpetualDepositEther(c, new BigNumber('2'), testGas)
  expect(tx.gasLimit.toString()).toEqual('1234567')
  expect(tx.gasPrice.toString()).toEqual('12345')
  await tx.wait()
})
