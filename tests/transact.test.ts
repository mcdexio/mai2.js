import { getContractReader, getGovParams } from '../src/data'
import { GovParams, TransactGas } from '../src/types'
import { getPerpetualContract, getAMMContract } from '../src/transact'
import { perpetualDeposit } from '../src/transact'
import { extendExpect } from './helper'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'

const testRpc = 'http://s1.jy.mcarlo.com:8545'
const testPerp = '0xceA230Eb53384A864659BB5f6CE89ebF9F1E1a97'
const testAMM = '0xF66dAfF401fE7e77b20ac760Ee6C229e37277819'
const testUserPK = '0x1c6a05d6d52954b74407a62f000450d0a748d26a7cc3477cd7f8d7c41d4992ce' // address (2) in our ganache test env
const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)
const walletWithProvider = new ethers.Wallet(testUserPK, rpcProvider)
const testGas: TransactGas = { gasLimit: 123456, gasPrice: new ethers.utils.BigNumber('12345') }

extendExpect()

let govParams: GovParams
let testAMMAddress: string

beforeAll(async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  govParams = await getGovParams(contractReader, testPerp)
  testAMMAddress = govParams.amm
})

it('perp.Deposit', async function () {
  const c = await getPerpetualContract(testPerp, walletWithProvider)
  const tx = await perpetualDeposit(c, new BigNumber('0.001'), 18, testGas)
  expect(tx.gasLimit.toString()).toEqual('123456')
  expect(tx.gasPrice.toString()).toEqual('12345')
})

it('get AMM by GovParams', async function () {
  const c = await getAMMContract(govParams, walletWithProvider)
  expect(c.address).toEqual(testAMMAddress)
})

it('amm.', async function () {
  await getAMMContract(testAMM, walletWithProvider)
})
