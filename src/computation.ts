/*
  Simulate the smart contract's computation.
*/

import { BigNumber } from 'bignumber.js'

import {
  GovParams,
  AccountStorage,
  AccountDetails,
  FundingParams,
  FundingResult,
  PerpetualStorage,
  AMMDetails,
  Depth,
  AMMDepth,
  BigNumberish
} from './types'
import { _0, _1, FUNDING_TIME, SIDE, _0_1 } from './constants'
import { bigLog, bigLn, normalizeBigNumberish } from './utils'

interface _AccumulatedFundingResult {
  acc: BigNumber
  emaPremium: BigNumber
}

function computeAccumulatedFunding(f: FundingParams, g: GovParams, timestamp: number): _AccumulatedFundingResult {
  const n = new BigNumber(timestamp - f.lastFundingTimestamp)
  const a = g.emaAlpha
  const v0 = f.lastEMAPremium

  //vt = (LastEMAPremium - LastPremium) * Pow(a, n) + LastPremium
  const vt = f.lastEMAPremium.minus(f.lastPremium).times(a.pow(n)).plus(f.lastPremium)
  //vLimit = GovMarkPremiumLimit * LastIndexPrice
  const vLimit = f.lastIndexPrice.times(g.markPremiumLimit)
  const vNegLimit = vLimit.negated()
  //vDampener = GovFundingDampener * LastIndexPrice
  const vDampener = f.lastIndexPrice.times(g.fundingDampener)
  const vNegDampener = vDampener.negated()
  //T(y) = Log(a, (y - LastPremium) / (v0 - LastPremium)) ，get time t
  //R(x, y) = (LastEMAPremium - LastPremium) * (Pow(a, x) - Pow(a, y)) / (1 - a) + LastPremium * (y - x) ，get accumulative from x to y

  // if lastEMAPremium == lastPremeium, we do not need tFunc() actually
  const tFunc = (y: BigNumber) => bigLog(a, y.minus(f.lastPremium).div(v0.minus(f.lastPremium)))
  const tt1 = f.lastEMAPremium.minus(f.lastPremium)
  const rFunc = (x: BigNumber, y: BigNumber) =>
    tt1.times(a.pow(y).minus(a.pow(x))).div(bigLn(a)).plus(f.lastPremium.times(y.minus(x)))
  let acc: BigNumber
  if (v0.isLessThanOrEqualTo(vNegLimit)) {
    if (vt.isLessThanOrEqualTo(vNegLimit)) {
      acc = vNegLimit.plus(vDampener).times(n)
    } else if (vt.isLessThanOrEqualTo(vNegDampener)) {
      const t1 = tFunc(vNegLimit)
      acc = vNegLimit.times(t1).plus(rFunc(t1, n)).plus(vDampener.times(n))
    } else if (vt.isLessThanOrEqualTo(vDampener)) {
      const t1 = tFunc(vNegLimit)
      const t2 = tFunc(vNegDampener)
      acc = vNegLimit.times(t1).plus(rFunc(t1, t2)).plus(vDampener.times(t2))
    } else if (vt.isLessThanOrEqualTo(vLimit)) {
      const t1 = tFunc(vNegLimit)
      const t2 = tFunc(vNegDampener)
      const t3 = tFunc(vDampener)
      acc = vNegLimit.times(t1).plus(rFunc(t1, t2)).plus(rFunc(t3, n)).plus(vDampener.times(t2.minus(n).plus(t3)))
    } else {
      const t1 = tFunc(vNegLimit)
      const t2 = tFunc(vNegDampener)
      const t3 = tFunc(vDampener)
      const t4 = tFunc(vLimit)
      acc = vLimit
        .times(n.minus(t1).minus(t4))
        .plus(rFunc(t1, t2))
        .plus(rFunc(t3, t4))
        .plus(vDampener.times(t2.minus(n).plus(t3)))
    }
  } else if (v0.isLessThanOrEqualTo(vNegDampener)) {
    if (vt.isLessThanOrEqualTo(vNegLimit)) {
      const t4 = tFunc(vNegLimit)
      acc = rFunc(_0, t4).plus(vNegLimit.times(n.minus(t4))).plus(vDampener.times(n))
    } else if (vt.isLessThanOrEqualTo(vNegDampener)) {
      acc = rFunc(_0, n).plus(vDampener.times(n))
    } else if (vt.isLessThanOrEqualTo(vDampener)) {
      const t2 = tFunc(vNegDampener)
      acc = rFunc(_0, t2).plus(vDampener.times(t2))
    } else if (vt.isLessThanOrEqualTo(vLimit)) {
      const t2 = tFunc(vNegDampener)
      const t3 = tFunc(vDampener)
      acc = rFunc(_0, t2).plus(rFunc(t3, n)).plus(vDampener.times(t2.minus(n).plus(t3)))
    } else {
      const t2 = tFunc(vNegDampener)
      const t3 = tFunc(vDampener)
      const t4 = tFunc(vLimit)
      acc = rFunc(_0, t2)
        .plus(rFunc(t3, t4))
        .plus(vLimit.times(n.minus(t4)))
        .plus(vDampener.times(t2.minus(n).plus(t3)))
    }
  } else if (v0.isLessThanOrEqualTo(vDampener)) {
    if (vt.isLessThanOrEqualTo(vNegLimit)) {
      const t3 = tFunc(vNegDampener)
      const t4 = tFunc(vNegLimit)
      acc = rFunc(t3, t4).plus(vNegLimit.times(n.minus(t4))).plus(vDampener.times(n.minus(t3)))
    } else if (vt.isLessThanOrEqualTo(vNegDampener)) {
      const t3 = tFunc(vNegDampener)
      acc = rFunc(t3, n).plus(vDampener.times(n.minus(t3)))
    } else if (vt.isLessThanOrEqualTo(vDampener)) {
      acc = _0
    } else if (vt.isLessThanOrEqualTo(vLimit)) {
      const t3 = tFunc(vDampener)
      acc = rFunc(t3, n).plus(vNegDampener.times(n.minus(t3)))
    } else {
      const t3 = tFunc(vDampener)
      const t4 = tFunc(vLimit)
      acc = rFunc(t3, t4).plus(vLimit.times(n.minus(t4))).plus(vNegDampener.times(n.minus(t3)))
    }
  } else if (v0.isLessThanOrEqualTo(vLimit)) {
    if (vt.isLessThanOrEqualTo(vNegLimit)) {
      const t2 = tFunc(vDampener)
      const t3 = tFunc(vNegDampener)
      const t4 = tFunc(vNegLimit)
      acc = rFunc(_0, t2)
        .plus(rFunc(t3, t4))
        .plus(vNegLimit.times(n.minus(t4)))
        .plus(vDampener.times(n.minus(t3).minus(t2)))
    } else if (vt.isLessThanOrEqualTo(vNegDampener)) {
      const t2 = tFunc(vDampener)
      const t3 = tFunc(vNegDampener)
      acc = rFunc(_0, t2).plus(rFunc(t3, n)).plus(vDampener.times(n.minus(t3).minus(t2)))
    } else if (vt.isLessThanOrEqualTo(vDampener)) {
      const t2 = tFunc(vDampener)
      acc = rFunc(_0, t2).plus(vNegDampener.times(t2))
    } else if (vt.isLessThanOrEqualTo(vLimit)) {
      acc = rFunc(_0, n).plus(vNegDampener.times(n))
    } else {
      const t4 = tFunc(vLimit)
      acc = rFunc(_0, t4).plus(vLimit.times(n.minus(t4))).plus(vNegDampener.times(n))
    }
  } else {
    if (vt.isLessThanOrEqualTo(vNegLimit)) {
      const t1 = tFunc(vLimit)
      const t2 = tFunc(vDampener)
      const t3 = tFunc(vNegDampener)
      const t4 = tFunc(vNegLimit)
      acc = vLimit
        .times(t1.minus(n).plus(t4))
        .plus(rFunc(t1, t2))
        .plus(rFunc(t3, t4))
        .plus(vDampener.times(n.minus(t3).minus(t2)))
    } else if (vt.isLessThanOrEqualTo(vNegDampener)) {
      const t1 = tFunc(vLimit)
      const t2 = tFunc(vDampener)
      const t3 = tFunc(vNegDampener)
      acc = vLimit.times(t1).plus(rFunc(t1, t2)).plus(rFunc(t3, n)).plus(vDampener.times(n.minus(t3).minus(t2)))
    } else if (vt.isLessThanOrEqualTo(vDampener)) {
      const t1 = tFunc(vLimit)
      const t2 = tFunc(vDampener)
      acc = vLimit.times(t1).plus(rFunc(t1, t2)).plus(vNegDampener.times(t2))
    } else if (vt.isLessThanOrEqualTo(vLimit)) {
      const t1 = tFunc(vLimit)
      acc = vLimit.times(t1).plus(rFunc(t1, n)).plus(vNegDampener.times(n))
    } else {
      acc = vLimit.minus(vDampener).times(n)
    }
  }
  acc = acc.div(f.lastIndexPrice).div(FUNDING_TIME)
  const emaPremium = vt
  return { acc, emaPremium }
}

export function computeFunding(f: FundingParams, g: GovParams, timestamp: number): FundingResult {
  if (timestamp < f.lastFundingTimestamp) {
    throw Error(`funding timestamp '${timestamp}' is early than last funding timestamp '${f.lastFundingTimestamp}'`)
  }

  const { acc, emaPremium } = computeAccumulatedFunding(f, g, timestamp)

  const accumulatedFundingPerContract = f.accumulatedFundingPerContract.plus(acc)
  const markPrice = f.lastIndexPrice.plus(emaPremium)
  let premiumRate = emaPremium.div(f.lastIndexPrice)
  if (premiumRate.isGreaterThan(g.markPremiumLimit)) {
    premiumRate = g.markPremiumLimit
  } else if (premiumRate.isLessThan(g.markPremiumLimit.negated())) {
    premiumRate = g.markPremiumLimit.negated()
  }
  let fundingRate = _0
  if (premiumRate.isGreaterThan(g.fundingDampener)) {
    fundingRate = premiumRate.minus(g.fundingDampener)
  } else if (premiumRate.isLessThan(g.fundingDampener.negated())) {
    fundingRate = premiumRate.plus(g.fundingDampener)
  }

  return { timestamp, accumulatedFundingPerContract, emaPremium, markPrice, premiumRate, fundingRate }
}

export function updateFundingParams(
  f: FundingParams,
  g: GovParams,
  timestamp: number,
  newIndexPrice: BigNumber,
  newFairPrice: BigNumber
): FundingParams {
  const result = computeFunding(f, g, timestamp)
  const accumulatedFundingPerContract = result.accumulatedFundingPerContract
  const lastFundingTimestamp = timestamp
  const lastEMAPremium = result.emaPremium
  const lastPremium = newFairPrice.minus(newIndexPrice)
  const lastIndexPrice = newIndexPrice
  return { accumulatedFundingPerContract, lastFundingTimestamp, lastEMAPremium, lastPremium, lastIndexPrice }
}

export function funding(
  p: PerpetualStorage,
  g: GovParams,
  timestamp: number,
  newIndexPrice: BigNumber,
  newFairPrice: BigNumber
): PerpetualStorage {
  const newFundingParams = updateFundingParams(p.fundingParams, g, timestamp, newIndexPrice, newFairPrice)
  return { ...p, fundingParams: newFundingParams }
}

export function computeAccount(s: AccountStorage, g: GovParams, p: PerpetualStorage): AccountDetails {
  const entryPrice = s.positionSize.isZero() ? _0 : s.entryValue.div(s.positionSize)
  const markPrice = p.fundingParams.lastIndexPrice.plus(p.fundingParams.lastEMAPremium)
  const positionValue = markPrice.times(s.positionSize)
  const positionMargin = markPrice.times(s.positionSize).times(g.intialMargin)
  const maintenanceMargin = markPrice.times(s.positionSize).times(g.maintenanceMargin)
  const shortFundingLoss = p.fundingParams.accumulatedFundingPerContract.times(
    s.positionSize.minus(s.entryFoundingLoss)
  )
  let socialLoss, fundingLoss, pnl1, liquidationPrice: BigNumber
  if (s.positionSide === SIDE.Buy) {
    socialLoss = p.longSocialLossPerContract.times(s.positionSize).minus(s.entrySocialLoss)
    fundingLoss = shortFundingLoss.negated()
    pnl1 = markPrice.times(s.positionSize).minus(s.entryValue)
    const t = s.positionSize.times(g.maintenanceMargin).minus(s.positionSize)
    liquidationPrice = s.cashBalance.minus(s.entryValue).minus(socialLoss).minus(fundingLoss).div(t)
    if (liquidationPrice.isNegative()) {
      liquidationPrice = _0
    }
  } else {
    socialLoss = p.shortSocialLossPerContract.times(s.positionSize).minus(s.entrySocialLoss)
    fundingLoss = shortFundingLoss
    pnl1 = s.entryValue.minus(markPrice.times(s.positionSize))
    const t = s.positionSize.times(g.maintenanceMargin).plus(s.positionSize)
    liquidationPrice = s.cashBalance.plus(s.entryValue).minus(socialLoss).minus(fundingLoss).div(t)
  }
  const pnl2 = pnl1.plus(socialLoss).plus(fundingLoss)
  const marginBalance = s.cashBalance.plus(pnl2)
  const roe = pnl2.div(s.cashBalance)
  const availableMargin = marginBalance.minus(positionMargin).minus(s.withdrawalApplication.amount)
  const withdrawableBalance = BigNumber.min(marginBalance.minus(positionMargin), s.withdrawalApplication.amount)
  const isSafe = maintenanceMargin.isGreaterThanOrEqualTo(marginBalance)
  const leverage = positionValue.div(marginBalance)
  const accountComputed = {
    entryPrice,
    positionValue,
    positionMargin,
    leverage,
    maintenanceMargin,
    socialLoss,
    fundingLoss,
    pnl1,
    pnl2,
    liquidationPrice,
    roe,
    marginBalance,
    availableMargin,
    withdrawableBalance,
    isSafe
  }
  return { accountStorage: s, accountComputed }
}

export function computeAMM(ammAccount: AccountStorage, g: GovParams, p: PerpetualStorage): AMMDetails {
  const accountDetails = computeAccount(ammAccount, g, p)
  const loss = accountDetails.accountComputed.socialLoss.plus(accountDetails.accountComputed.fundingLoss)
  const availableMargin = ammAccount.cashBalance.minus(ammAccount.entryValue).minus(loss)

  const x = availableMargin
  const y = ammAccount.positionSize

  let impactAskPrice: BigNumber
  const impactAskPriceCap = availableMargin.div(y).times(_1.plus(g.fairPriceMaxGap))
  const impactBidPriceCap = availableMargin.div(y).times(_1.minus(g.fairPriceMaxGap))
  if (y.isLessThanOrEqualTo(g.fairPriceAmount)) {
    impactAskPrice = impactAskPriceCap
  } else {
    impactAskPrice = BigNumber.min(x.div(y.minus(g.fairPriceAmount)), impactAskPriceCap)
  }
  const impactBidPrice = BigNumber.max(x.div(y.plus(g.fairPriceAmount)), impactBidPriceCap)
  const fairPrice = impactBidPrice.plus(impactAskPrice).div(2)
  const ammPrice = x.div(y)

  const ammComputed = { availableMargin, impactAskPrice, impactBidPrice, fairPrice, ammPrice }

  return { ...accountDetails, ammComputed }
}

export function computeAMMPrice(amm: AMMDetails, side: SIDE, amount: BigNumberish): BigNumber {
  const normalizedAmount = normalizeBigNumberish(amount)
  const x = amm.ammComputed.availableMargin
  const y = amm.accountStorage.positionSize

  if (side === SIDE.Buy) {
    if (normalizedAmount.isGreaterThanOrEqualTo(y)) {
      throw Error(`buy amount '${normalizedAmount}' is larger than the amm's position size '${y}'`)
    }
    return x.div(y.minus(normalizedAmount))
  } else {
    return x.div(y.plus(normalizedAmount))
  }
}

export function computeAMMDepth(amm: AMMDetails, step: BigNumberish = _0_1, nSamples: number = 20): AMMDepth {
  let asks: Array<Depth> = [ { price: amm.ammComputed.ammPrice, amount: _0 } ]
  let bids: Array<Depth> = [ { price: amm.ammComputed.ammPrice, amount: _0 } ]
  const normalizedStep = normalizeBigNumberish(step)

  for (let amount = normalizedStep, i = 0; i < nSamples; i++, amount = amount.plus(normalizedStep)) {
    const price = computeAMMPrice(amm, SIDE.Sell, amount)
    bids.unshift({ price, amount })
  }

  for (let amount = normalizedStep, i = 0; i < nSamples; i++, amount = amount.plus(normalizedStep)) {
    const price = computeAMMPrice(amm, SIDE.Buy, amount)
    asks.push({ price, amount })
  }

  return { bids, asks }
}
