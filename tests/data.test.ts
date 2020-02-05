import {
  getContractReader,
  getGovParams,
  getPerpetualStorage,
  getAccountStroage
} from '../src/data'
import { SIDE, _0, _1, _1000, _0_1, _0_01 } from '../src/constants'
import {
  GovParams,
  PerpetualStorage,
  AccountStorage
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'
import { ethers } from 'ethers'

const testRpc = 'http://192.168.1.8:8645'
const testPerp = '0x048e5F4ecfa68Bd833730484FBF2BE163Bb4E8B4'
const testUser = '0x31Ebd457b999Bf99759602f5Ece5AA5033CB56B3'
const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)

extendExpect()

it('param', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: GovParams = await getGovParams(contractReader, testPerp)
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
  expect(p.totalSize).toBeBigNumber(normalizeBigNumberish('100'))
  expect(p.longSocialLossPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.shortSocialLossPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.isEmergency).toBeFalsy()
  expect(p.isGlobalSettled).toBeFalsy()
  expect(p.globalSettlePrice).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.accumulatedFundingPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.lastEMAPremium).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.lastPremium).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.fundingParams.lastIndexPrice).toBeBigNumber(normalizeBigNumberish('7000'))
  expect(p.fundingParams.lastFundingTimestamp).not.toEqual(0)
})

it('account', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: AccountStorage = await getAccountStroage(contractReader, testPerp, testUser)
  expect(p.cashBalance).toBeBigNumber(normalizeBigNumberish('700000'))
  expect(p.withdrawalApplication.amount).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.withdrawalApplication.height).toEqual(0)
  expect(p.positionSide).toEqual(SIDE.Sell)
  expect(p.positionSize).toBeBigNumber(normalizeBigNumberish('100'))
  expect(p.entryValue).toBeBigNumber(normalizeBigNumberish('700000'))
  expect(p.entrySocialLoss).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.entryFundingLoss).toBeBigNumber(normalizeBigNumberish('0'))
})
