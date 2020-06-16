import { getContractReader, getGovParams, getPerpetualStorage, getAccountStorage } from '../src/data'
import { SIDE, _0, _1, _1000, _0_1, _0_01 } from '../src/constants'
import { GovParams, PerpetualStorage, AccountStorage } from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'
import { ethers } from 'ethers'
import { testRpc, testUser, dataTestAddress } from './eth_address'

import { mintTestToken, createPoolForTestToken, approvePerp, isPoolEmpty } from './init_env'
import { testAdmin, testU2, testContractReader } from './eth_address'
import { CONTRACT_READER_ADDRESS, SUPPORTED_NETWORK_ID } from '../src/constants'

const rpcProvider = new ethers.providers.JsonRpcProvider(testRpc)

beforeAll(async done => {
  if (await isPoolEmpty(dataTestAddress, rpcProvider)) {
    console.log('> initializing dataTestAddress')
    await mintTestToken(dataTestAddress, testAdmin, rpcProvider)
    await createPoolForTestToken(dataTestAddress, testUser, rpcProvider)
    await approvePerp(dataTestAddress, testU2, rpcProvider)
    console.log('> initializing dataTestAddress done')
  } else {
    console.log('> already initialized')
  }

  CONTRACT_READER_ADDRESS[SUPPORTED_NETWORK_ID.S1] = testContractReader
  done()
})

extendExpect()

it('param', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: GovParams = await getGovParams(contractReader, dataTestAddress.perp)
  expect(p.amm).toEqual(dataTestAddress.amm)
  expect(p.poolAccount).toEqual(dataTestAddress.perpProxy)

  expect(p.initialMargin).toBeBigNumber(normalizeBigNumberish('0.1'))
  expect(p.maintenanceMargin).toBeBigNumber(normalizeBigNumberish('0.05'))
  expect(p.liquidationPenaltyRate).toBeBigNumber(normalizeBigNumberish('0.005'))
  expect(p.penaltyFundRate).toBeBigNumber(normalizeBigNumberish('0.005'))
  expect(p.makerDevRate).toBeBigNumber(normalizeBigNumberish('-0.00025'))
  expect(p.takerDevRate).toBeBigNumber(normalizeBigNumberish('0.00075'))
  expect(p.lotSize).toBeBigNumber(normalizeBigNumberish('1e-18'))
  expect(p.tradingLotSize).toBeBigNumber(normalizeBigNumberish('1e-18'))

  expect(p.poolFeeRate).toBeBigNumber(normalizeBigNumberish('0.000375'))
  expect(p.poolDevFeeRate).toBeBigNumber(normalizeBigNumberish('0.000375'))
  expect(p.emaAlpha).toBeBigNumber(normalizeBigNumberish('0.003327787021630616')) // 2 / (600 + 1)
  expect(p.markPremiumLimit).toBeBigNumber(normalizeBigNumberish('0.005'))
  expect(p.fundingDampener).toBeBigNumber(normalizeBigNumberish('0.0005'))
})

it('perp', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: PerpetualStorage = await getPerpetualStorage(contractReader, dataTestAddress.perp)
  expect(p.collateralTokenAddress).not.toEqual('')
  expect(p.collateralTokenAddress).not.toEqual('0x')
  expect(p.collateralTokenAddress).not.toEqual('0x0000000000000000000000000000000000000000')
  expect(p.shareTokenAddress).not.toEqual('')
  expect(p.shareTokenAddress).not.toEqual('0x')
  expect(p.shareTokenAddress).not.toEqual('0x0000000000000000000000000000000000000000')
  expect(p.shareTokenAddress).not.toEqual(p.collateralTokenAddress)
  expect(p.totalSize).toBeBigNumber(normalizeBigNumberish('1000000'))
  expect(p.longSocialLossPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.shortSocialLossPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.insuranceFundBalance).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.isEmergency).toBeFalsy()
  expect(p.isGlobalSettled).toBeFalsy()
  expect(p.globalSettlePrice).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.accumulatedFundingPerContract).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.lastEMAPremium).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.lastPremium).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.lastIndexPrice).toBeBigNumber(normalizeBigNumberish('0.005')) // price = 1 / $200
  expect(p.lastFundingTimestamp).not.toEqual(0)
})

it('account', async function () {
  const contractReader: ethers.Contract = await getContractReader(rpcProvider)
  const p: AccountStorage = await getAccountStorage(contractReader, dataTestAddress.perp, testUser)
  expect(p.cashBalance).toBeBigNumber(normalizeBigNumberish('15000')) // position * 3 * price
  expect(p.positionSide).toEqual(SIDE.Sell)
  expect(p.positionSize).toBeBigNumber(normalizeBigNumberish('1000000'))
  expect(p.entryValue).toBeBigNumber(normalizeBigNumberish('5000')) // position * price
  expect(p.entrySocialLoss).toBeBigNumber(normalizeBigNumberish('0'))
  expect(p.entryFundingLoss).toBeBigNumber(normalizeBigNumberish('0'))
})
