import { getContractReader, getGovParams, getPerpetualStorage, getAccountStroage } from '../src/data'
import { SIDE, _0, _1, _1000, _0_1, _0_01 } from '../src/constants'
import { GovParams, PerpetualStorage, AccountStorage } from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'
import { ethers } from 'ethers'

const testRpc = 'http://s1.jy.mcarlo.com:8545'
const testPerp = '0x4d4Aa606e4Cc72C88bF25CB77dB6D0F66E9614F2'
const testAMM = '0xeC2289d88d06E2047BdC4aE4483E11A21A6E54f0'
const testPerpProxy = '0x65072Cb5aAe204f113bd04e02f0875eD477EB229'
const testUser = '0x31Ebd457b999Bf99759602f5Ece5AA5033CB56B3' // address (1) in our ganache test env
const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)

extendExpect()

it('param', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: GovParams = await getGovParams(contractReader, testPerp)
  expect(p.amm).toEqual(testAMM)
  expect(p.poolAccount).toEqual(testPerpProxy)

  expect(p.withdrawalLockBlockCount).toEqual(5)
  expect(p.brokerLockBlockCount).toEqual(5)

  expect(p.intialMargin).toBeBigNumber(normalizeBigNumberish('0.1'))
  expect(p.maintenanceMargin).toBeBigNumber(normalizeBigNumberish('0.05'))
  expect(p.liquidationSafetyFactor).toBeBigNumber(normalizeBigNumberish('0.2'))
  expect(p.liquidationPenaltyRate).toBeBigNumber(normalizeBigNumberish('0.01'))
  expect(p.penaltyFundRate).toBeBigNumber(normalizeBigNumberish('0.5'))
  expect(p.makerDevRate).toBeBigNumber(normalizeBigNumberish('0.01'))
  expect(p.takerDevRate).toBeBigNumber(normalizeBigNumberish('0.01'))

  expect(p.poolFeeRate).toBeBigNumber(normalizeBigNumberish('0.01'))
  expect(p.poolDevFeeRate).toBeBigNumber(normalizeBigNumberish('0.005'))
  expect(p.emaAlpha).toBeBigNumber(normalizeBigNumberish('0.003327787021630616')) // 2 / (600 + 1)
  expect(p.markPremiumLimit).toBeBigNumber(normalizeBigNumberish('0.005'))
  expect(p.fundingDampener).toBeBigNumber(normalizeBigNumberish('0.0005'))
})

it('perp', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: PerpetualStorage = await getPerpetualStorage(contractReader, testPerp)
  expect(p.collateralTokenAddress).not.toEqual('')
  expect(p.collateralTokenAddress).not.toEqual('0x')
  expect(p.collateralTokenAddress).not.toEqual('0x0000000000000000000000000000000000000000')
  expect(p.totalSize).toBeBigNumber(normalizeBigNumberish('1000000'))
  expect(p.longSocialLossPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.shortSocialLossPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.isEmergency).toBeFalsy()
  expect(p.isGlobalSettled).toBeFalsy()
  expect(p.globalSettlePrice).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.accumulatedFundingPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.lastEMAPremium).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.lastPremium).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.lastIndexPrice).toBeBigNumber(normalizeBigNumberish('0.005')) // price = 1 / $200
  expect(p.fundingParams.lastFundingTimestamp).not.toEqual(0)
})

it('account', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: AccountStorage = await getAccountStroage(contractReader, testPerp, testUser)
  expect(p.cashBalance).toBeBigNumber(normalizeBigNumberish('5000')) // position * price
  expect(p.broker.previousBroker).toEqual('0x0000000000000000000000000000000000000000')
  expect(p.broker.previousAppliedHeight).toEqual(0)
  expect(p.broker.currentBroker).toEqual(testAMM)
  expect(p.broker.currentAppliedHeight).toBeGreaterThan(0)
  expect(p.withdrawalApplication.amount).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.withdrawalApplication.height).toEqual(0)
  expect(p.positionSide).toEqual(SIDE.Sell)
  expect(p.positionSize).toBeBigNumber(normalizeBigNumberish('1000000'))
  expect(p.entryValue).toBeBigNumber(normalizeBigNumberish('5000')) // position * price
  expect(p.entrySocialLoss).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.entryFundingLoss).toBeBigNumber(normalizeBigNumberish('0'))
})
