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
  BigNumberish,
  FundingGovParams,
  AccountComputed
} from './types'
import { _0, _1, FUNDING_TIME, SIDE, _0_1 } from './constants'
import { bigLog, normalizeBigNumberish } from './utils'

interface _AccumulatedFundingResult {
  acc: BigNumber
  emaPremium: BigNumber
}

export function _tFunc(y: BigNumber, a2: BigNumber, lastPremium: BigNumber, v0: BigNumber): BigNumber {
  return bigLog(a2, y.minus(lastPremium).div(v0.minus(lastPremium))).dp(0, BigNumber.ROUND_UP)
}

export function _rFunc(
  x: BigNumber,
  y: BigNumber,
  a: BigNumber,
  a2: BigNumber,
  lastPremium: BigNumber,
  v0: BigNumber
): BigNumber {
  const tt1 = v0.minus(lastPremium)
  return tt1.times(a2.pow(x).minus(a2.pow(y))).div(a).plus(lastPremium.times(y.minus(x)))
}

export function computeAccumulatedFunding(
  f: FundingParams,
  g: FundingGovParams,
  timestamp: number
): _AccumulatedFundingResult {
  const n = new BigNumber(timestamp - f.lastFundingTimestamp)
  const a = g.emaAlpha
  const a2 = _1.minus(g.emaAlpha)
  const v0 = f.lastEMAPremium

  //vt = (LastEMAPremium - LastPremium) * Pow(a2, n) + LastPremium
  const vt = f.lastEMAPremium.minus(f.lastPremium).times(a2.pow(n)).plus(f.lastPremium)
  //vLimit = GovMarkPremiumLimit * LastIndexPrice
  const vLimit = f.lastIndexPrice.times(g.markPremiumLimit)
  const vNegLimit = vLimit.negated()
  //vDampener = GovFundingDampener * LastIndexPrice
  const vDampener = f.lastIndexPrice.times(g.fundingDampener)
  const vNegDampener = vDampener.negated()
  //T(y) = Log(a2, (y - LastPremium) / (v0 - LastPremium)) ，get time t
  //R(x, y) = (LastEMAPremium - LastPremium) * (Pow(a2, x) - Pow(a2, y)) / a + LastPremium * (y - x) ，get accumulative from x to y

  // if lastEMAPremium == lastPremeium, we do not need tFunc() actually
  const tFunc = (y: BigNumber) => _tFunc(y, a2, f.lastPremium, v0)
  const rFunc = (x: BigNumber, y: BigNumber) => _rFunc(x, y, a, a2, f.lastPremium, v0)
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

  const emaPremium = vt
  return { acc, emaPremium }
}

export function computeFunding(f: FundingParams, g: FundingGovParams, timestamp: number): FundingResult {
  if (timestamp < f.lastFundingTimestamp) {
    throw Error(`funding timestamp '${timestamp}' is early than last funding timestamp '${f.lastFundingTimestamp}'`)
  }

  let { acc, emaPremium } = computeAccumulatedFunding(f, g, timestamp)
  acc = acc.div(f.lastIndexPrice).div(FUNDING_TIME)

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
  g: FundingGovParams,
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
  g: FundingGovParams,
  timestamp: number,
  newIndexPrice: BigNumber,
  newFairPrice: BigNumber
): PerpetualStorage {
  const newFundingParams = updateFundingParams(p.fundingParams, g, timestamp, newIndexPrice, newFairPrice)
  return { ...p, fundingParams: newFundingParams }
}

export function computeAccount(s: AccountStorage, g: GovParams, p: PerpetualStorage, f: FundingResult): AccountDetails {
  const entryPrice = s.positionSize.isZero() ? _0 : s.entryValue.div(s.positionSize)
  const markPrice = f.markPrice
  const positionValue = markPrice.times(s.positionSize)
  const positionMargin = markPrice.times(s.positionSize).times(g.intialMargin)
  const maintenanceMargin = markPrice.times(s.positionSize).times(g.maintenanceMargin)
  const longFundingLoss = f.accumulatedFundingPerContract.times(s.positionSize).minus(s.entryFundingLoss)
  let socialLoss, fundingLoss, pnl1, liquidationPrice, inverseEntryPrice, inverseLiquidationPrice: BigNumber
  let inverseSide: SIDE
  if (s.positionSide === SIDE.Flat) {
    socialLoss = _0
    fundingLoss = _0
    pnl1 = _0
    liquidationPrice = _0
    inverseEntryPrice = _0
    inverseLiquidationPrice = _0
    inverseSide = SIDE.Flat
  } else {
    if (s.positionSide === SIDE.Buy) {
      socialLoss = p.longSocialLossPerContract.times(s.positionSize).minus(s.entrySocialLoss)
      fundingLoss = longFundingLoss
      pnl1 = markPrice.times(s.positionSize).minus(s.entryValue)
      const t = s.positionSize.times(g.maintenanceMargin).minus(s.positionSize)
      liquidationPrice = s.cashBalance.minus(s.entryValue).minus(socialLoss).minus(fundingLoss).div(t)
      if (liquidationPrice.isNegative()) {
        liquidationPrice = _0
      }
    } else {
      socialLoss = p.shortSocialLossPerContract.times(s.positionSize).minus(s.entrySocialLoss)
      fundingLoss = longFundingLoss.negated()
      pnl1 = s.entryValue.minus(markPrice.times(s.positionSize))
      const t = s.positionSize.times(g.maintenanceMargin).plus(s.positionSize)
      liquidationPrice = s.cashBalance.plus(s.entryValue).minus(socialLoss).minus(fundingLoss).div(t)
    }
    inverseEntryPrice = _1.div(entryPrice)
    inverseLiquidationPrice = _1.div(liquidationPrice)
    inverseSide = s.positionSide === SIDE.Buy ? SIDE.Sell : SIDE.Buy
  }
  const pnl2 = pnl1.minus(socialLoss).minus(fundingLoss)
  const marginBalance = s.cashBalance.plus(pnl2)
  const roe = pnl2.div(s.cashBalance)
  const maxWithdrawable = BigNumber.max(_0, marginBalance.minus(positionMargin))
  const availableMargin = BigNumber.max(_0, maxWithdrawable.minus(s.withdrawalApplication.amount))
  const withdrawableBalance = BigNumber.min(maxWithdrawable, s.withdrawalApplication.amount)
  const isSafe = maintenanceMargin.isLessThanOrEqualTo(marginBalance)
  const leverage = positionValue.div(marginBalance)

  const accountComputed: AccountComputed = {
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
    maxWithdrawable,
    availableMargin,
    withdrawableBalance,
    isSafe,
    inverseSide,
    inverseEntryPrice,
    inverseLiquidationPrice
  }
  return { accountStorage: s, accountComputed }
}

export function computeAMM(
  ammAccount: AccountStorage,
  g: GovParams,
  p: PerpetualStorage,
  f: FundingResult
): AMMDetails {
  const accountDetails = computeAccount(ammAccount, g, p, f)
  const loss = accountDetails.accountComputed.socialLoss.plus(accountDetails.accountComputed.fundingLoss)
  const availableMargin = ammAccount.cashBalance.minus(ammAccount.entryValue).minus(loss)

  const x = availableMargin
  const y = ammAccount.positionSize

  const fairPrice = x.div(y)
  const inverseFairPrice = y.div(x)
  const ammComputed = { availableMargin, fairPrice, inverseFairPrice }

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
  let asks: Array<Depth> = [ { price: amm.ammComputed.fairPrice, amount: _0 } ]
  let bids: Array<Depth> = [ { price: amm.ammComputed.fairPrice, amount: _0 } ]
  const normalizedStep = normalizeBigNumberish(step)

  for (let amount = normalizedStep, i = 0; i < nSamples; i++, amount = amount.plus(normalizedStep)) {
    const price = computeAMMPrice(amm, SIDE.Sell, amount)
    bids.unshift({ price, amount })
  }

  for (let amount = normalizedStep, i = 0; i < nSamples; i++, amount = amount.plus(normalizedStep)) {
    if (amount.isGreaterThanOrEqualTo(amm.accountStorage.positionSize)) {
      break
    }
    const price = computeAMMPrice(amm, SIDE.Buy, amount)
    asks.push({ price, amount })
  }

  return { bids, asks }
}

export function computeAMMInversePrice(amm: AMMDetails, side: SIDE, amount: BigNumberish): BigNumber {
  const normalizedAmount = normalizeBigNumberish(amount)
  const x = amm.ammComputed.availableMargin
  const y = amm.accountStorage.positionSize

  if (side === SIDE.Sell) {
    if (normalizedAmount.isGreaterThanOrEqualTo(y)) {
      throw Error(`sell inverse amount '${normalizedAmount}' is larger than the amm's position size '${y}'`)
    }
    return y.minus(normalizedAmount).div(x)
  } else {
    return y.plus(normalizedAmount).div(x)
  }
}

export function computeAMMInverseDepth(amm: AMMDetails, step: BigNumberish = _0_1, nSamples: number = 20): AMMDepth {
  let asks: Array<Depth> = [ { price: amm.ammComputed.inverseFairPrice, amount: _0 } ]
  let bids: Array<Depth> = [ { price: amm.ammComputed.inverseFairPrice, amount: _0 } ]
  const normalizedStep = normalizeBigNumberish(step)

  for (let amount = normalizedStep, i = 0; i < nSamples; i++, amount = amount.plus(normalizedStep)) {
    if (amount.isGreaterThanOrEqualTo(amm.accountStorage.positionSize)) {
      break
    }
    const price = computeAMMInversePrice(amm, SIDE.Sell, amount)
    bids.unshift({ price, amount })
  }

  for (let amount = normalizedStep, i = 0; i < nSamples; i++, amount = amount.plus(normalizedStep)) {
    const price = computeAMMInversePrice(amm, SIDE.Buy, amount)
    asks.push({ price, amount })
  }

  return { bids, asks }
}

export function computeDecreasePosition(
  p: PerpetualStorage,
  f: FundingResult,
  a: AccountStorage,
  price: BigNumber,
  amount: BigNumber
): AccountStorage {
  const size = a.positionSize
  const side = a.positionSide
  let entryValue = a.entryValue
  let entrySocialLoss = a.entrySocialLoss
  let entryFundingLoss = a.entryFundingLoss
  if (side === SIDE.Flat) {
    throw Error(`bad side ${side} to decrease.`)
  }
  if (price.isLessThanOrEqualTo(_0) || amount.isLessThanOrEqualTo(_0)) {
    throw Error(`bad price ${price} or amount ${amount}`)
  }
  if (size.isLessThan(amount)) {
    throw Error(`position size ${size} is less than amount ${amount}`)
  }
  let rpnl1, socialLoss, fundingLoss: BigNumber
  if (side === SIDE.Buy) {
    rpnl1 = price.times(amount).minus(entryValue.times(amount).div(size))
    socialLoss = p.longSocialLossPerContract.minus(entrySocialLoss.div(size)).times(amount)
    fundingLoss = f.accumulatedFundingPerContract.minus(entryFundingLoss.div(size)).times(amount)
  } else {
    rpnl1 = entryValue.times(amount).div(size).minus(price.times(amount))
    socialLoss = p.shortSocialLossPerContract.minus(entrySocialLoss.div(size)).times(amount)
    fundingLoss = f.accumulatedFundingPerContract.minus(entryFundingLoss.div(size)).times(amount).negated()
  }
  const rpnl2 = rpnl1.minus(socialLoss).minus(fundingLoss)
  const positionSize = size.minus(amount)
  const positionSide = positionSize.isZero() ? SIDE.Flat : side
  entrySocialLoss = entryFundingLoss.times(positionSize).div(size)
  entryFundingLoss = entryFundingLoss.times(positionSize).div(size)
  entryValue = entryValue.times(positionSize).div(size)
  const cashBalance = a.cashBalance.plus(rpnl2)

  return { ...a, entryValue, positionSide, positionSize, entrySocialLoss, entryFundingLoss, cashBalance }
}

export function computeIncreasePosition(
  p: PerpetualStorage,
  f: FundingResult,
  a: AccountStorage,
  side: SIDE,
  price: BigNumber,
  amount: BigNumber
): AccountStorage {
  let positionSize = a.positionSize
  let positionSide = a.positionSide
  let entryValue = a.entryValue
  let entrySocialLoss = a.entrySocialLoss
  let entryFundingLoss = a.entryFundingLoss
  if (price.isLessThanOrEqualTo(_0) || amount.isLessThanOrEqualTo(_0)) {
    throw Error(`bad price ${price} or amount ${amount}`)
  }
  if (side == SIDE.Flat) {
    throw Error(`bad increase side ${side}`)
  }
  if (positionSide != SIDE.Flat && positionSide != side) {
    throw Error(`bad increase side ${side} where position side is ${positionSide}`)
  }

  positionSide = side
  entryValue = entryValue.plus(price.times(amount))
  positionSize = positionSize.plus(amount)
  if (side == SIDE.Buy) {
    entrySocialLoss = entrySocialLoss.plus(p.longSocialLossPerContract.times(amount))
  } else {
    entrySocialLoss = entrySocialLoss.plus(p.shortSocialLossPerContract.times(amount))
  }
  entryFundingLoss = entryFundingLoss.plus(f.accumulatedFundingPerContract.times(amount))

  return { ...a, positionSide, entryValue, positionSize, entrySocialLoss, entryFundingLoss }
}

export function computeFee(price: BigNumberish, amount: BigNumberish, feeRate: BigNumberish): BigNumber {
  const normalizedPrice = normalizeBigNumberish(price)
  const normalizedAmount = normalizeBigNumberish(amount)
  const normalizedFeeRate = normalizeBigNumberish(feeRate)
  if (normalizedPrice.isLessThanOrEqualTo(_0) || normalizedAmount.isLessThanOrEqualTo(_0)) {
    throw Error(`bad price ${normalizedPrice} or amount ${normalizedAmount}`)
  }
  return normalizedPrice.times(normalizedAmount).times(normalizedFeeRate)
}

export function computeTrade(
  p: PerpetualStorage,
  f: FundingResult,
  a: AccountStorage,
  side: SIDE,
  price: BigNumberish,
  amount: BigNumberish,
  feeRate: BigNumberish
): AccountStorage {
  const normalizedPrice = normalizeBigNumberish(price)
  const normalizedAmount = normalizeBigNumberish(amount)
  const normalizedFeeRate = normalizeBigNumberish(feeRate)
  if (!normalizedPrice.isPositive() || !normalizedAmount.isPositive()) {
    throw Error(`bad price ${normalizedPrice} or amount ${normalizedAmount}`)
  }
  let storage: AccountStorage = a
  let toDecrease, toIncrease: BigNumber
  if (a.positionSize.isPositive() && a.positionSide != side) {
    toDecrease = BigNumber.min(a.positionSize, normalizedAmount)
    toIncrease = normalizedAmount.minus(toDecrease)
  } else {
    toDecrease = _0
    toIncrease = normalizedAmount
  }

  if (toDecrease.isGreaterThan(_0)) {
    storage = computeDecreasePosition(p, f, storage, normalizedPrice, toDecrease)
  }
  if (toIncrease.isGreaterThan(_0)) {
    storage = computeIncreasePosition(p, f, storage, side, normalizedPrice, toIncrease)
  }
  const fee = computeFee(normalizedPrice, normalizedAmount, normalizedFeeRate)
  storage.cashBalance = storage.cashBalance.minus(fee)
  return storage
}

export interface TradeCost {
  account: AccountDetails
  marginCost: BigNumber
  toDeposit: BigNumber
  fee: BigNumber
}

export function computeTradeCost(
  g: GovParams,
  p: PerpetualStorage,
  f: FundingResult,
  a: AccountDetails,
  side: SIDE,
  price: BigNumberish,
  amount: BigNumberish,
  leverage: BigNumberish,
  feeRate: BigNumberish
): TradeCost {
  const normalizedLeverage = normalizeBigNumberish(leverage)
  if (!normalizedLeverage.isPositive()) {
    throw Error(`bad leverage ${normalizedLeverage}`)
  }
  const accountStorage = computeTrade(p, f, a.accountStorage, side, price, amount, feeRate)
  const account = computeAccount(accountStorage, g, p, f)
  const positionMargin = accountStorage.positionSize.times(f.markPrice).div(normalizedLeverage)
  const marginCost = BigNumber.max(_0, positionMargin.minus(a.accountComputed.positionMargin))
  const toDeposit = positionMargin.minus(account.accountComputed.marginBalance)
  const fee = computeFee(price, amount, feeRate)

  return { account, marginCost, toDeposit, fee }
}

export interface AMMTradeCost extends TradeCost {
  price: BigNumber
}

export function computAMMTradeCost(
  amm: AMMDetails,
  g: GovParams,
  p: PerpetualStorage,
  f: FundingResult,
  a: AccountDetails,
  side: SIDE,
  amount: BigNumberish,
  leverage: BigNumberish
): AMMTradeCost {
  const feeRate = g.ammFeeRate.plus(g.takerDevRate)
  const price = computeAMMPrice(amm, side, amount)
  const cost = computeTradeCost(g, p, f, a, side, price, amount, leverage, feeRate)
  return { ...cost, price }
}

export function computeDepositByLeverage(a: AccountDetails, f: FundingResult, leverage: BigNumberish): BigNumber {
  const normalizedLeverage = normalizeBigNumberish(leverage)
  if (!normalizedLeverage.isPositive()) {
    throw Error(`bad leverage ${normalizedLeverage}`)
  }
  const positionMargin = a.accountStorage.positionSize.times(f.markPrice).div(normalizedLeverage)
  return positionMargin.minus(a.accountComputed.marginBalance)
}
