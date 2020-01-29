import BigNumber from 'bignumber.js'
import {
  _tFunc,
  _rFunc,
  computeAccumulatedFunding,
  computeAccount,
  computeFunding,
  funding,
  computeAMM,
  computeAMMPrice,
  computeAMMDepth,
  computeAMMInversePrice,
  computeAMMInverseDepth,
  computeDecreasePosition,
  computeIncreasePosition,
  computeFee,
  computeTradeCost
} from '../src/computation'
import { DECIMALS, _0, _1, SIDE, FUNDING_TIME, _1000, _0_1, _0_01 } from '../src/constants'
import {
  BigNumberish,
  FundingGovParams,
  FundingParams,
  PerpetualStorage,
  AccountStorage,
  GovParams,
  AccountComputed,
  AccountDetails
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'

extendExpect()

function getBN(s: string): BigNumber {
  return new BigNumber(s).shiftedBy(-DECIMALS)
}

describe('funding', function() {
  const emaAlpha = '3327787021630616' // 2 / (600 + 1)
  const markPremiumLimit = '5000000000000000' // 0.5%
  const fundingDampener = '500000000000000' // 0.05%

  it(`timeOnFundingCurve - upward`, function() {
    const a2 = _1.minus(getBN(emaAlpha))
    // y = -0.5% = -35 => t = 86.3
    let r = _tFunc(getBN('-35000000000000000000'), a2, getBN('70000000000000000000'), getBN('-70000000000000000000'))
    expect(r.toString()).toEqual('87')
    // y = +0.5% = 35 => t = 415.8
    r = _tFunc(getBN('35000000000000000000'), a2, getBN('70000000000000000000'), getBN('-70000000000000000000'))
    expect(r.toString()).toEqual('416')
  })

  it(`timeOnFundingCurve - critical`, function() {
    // y is very close to lastPremium
    // index -> 1
    // lastEMAPremium(v0) -> 0
    // lastPremium -> 1 * (-limit - 1e-18)
    // y = -limit = -0.005 => t = 10844.5
    const a2 = _1.minus(getBN(emaAlpha))
    let r = _tFunc(getBN('-5000000000000000'), a2, getBN('-5000000000000001'), getBN('0'))
    expect(r.toString()).toEqual('10845')
    // lastEMAPremium is very close to lastPremium
    // index -> 1
    // lastEMAPremium(v0) -> 1 * (-limit - 1e-18)
    // lastPremium -> 1 * (-limit + 1e-18)
    // y = -limit = -0.005 => t = 207.9
    r = _tFunc(getBN('-5000000000000000'), a2, getBN('-4999999999999999'), getBN('-5000000000000001'))
    expect(r.toString()).toEqual('208')
  })

  // integrateOnFundingCurve(x, y, v0, lastPremium)
  // index -> 7000
  // lastEMAPremium(v0) -> 7000 * 99% - 7000 (* markPrice = index * 99% *)
  // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
  // the curve is upward
  it('integrateOnFundingCurve - upward', function() {
    const a = getBN(emaAlpha)
    const a2 = _1.minus(a)

    // sum in [86, 100) = -460
    const i = _rFunc(
      new BigNumber('86'),
      new BigNumber('100'),
      a,
      a2,
      getBN('70000000000000000000'),
      getBN('-70000000000000000000')
    )

    expect(i).toApproximate(getBN('-460083547083783088496'))
  })

  // integrateOnFundingCurve(x, y, v0, lastPremium)
  // index -> 7000
  // lastEMAPremium(v0) -> 7000 * 101% - 7000 (* markPrice = index * 101% *)
  // lastPremium -> -7000 * 1% (* markPrice = index * 99% *)
  // the curve is downward
  it('integrateOnFundingCurve - downward', function() {
    const a = getBN(emaAlpha)
    const a2 = _1.minus(a)
    // sum in [86, 100) = 460
    const i = _rFunc(
      new BigNumber('86'),
      new BigNumber('100'),
      a,
      a2,
      getBN('-70000000000000000000'),
      getBN('70000000000000000000')
    )
    expect(i).toApproximate(getBN('460083547083783088496'))
  })

  const getAccumulatedFundingCase1IndexPrice = '7000000000000000000000'
  const getAccumulatedFundingCase1 = [
    // lastEMAPremium(v0), lastPremium, T, vt, acc

    // upward part A
    // lastEMAPremium(v0) -> 7000 * 99% - 7000 (* markPrice = index * 99% *)
    // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
    // A -> A, T <= 86.3, vt = -35, acc = -2709
    [ '-70000000000000000000', '70000000000000000000', '86', '-35106643857103393523', '-2709000000000000000000' ],
    // A -> B, T <= 193.3, vt = -3, acc = -4319
    [ '-70000000000000000000', '70000000000000000000', '193', '-3575235401854865263', '-4319581596945078325265' ],
    // A -> C, T <= 223, vt = 3, acc = -4319
    [ '-70000000000000000000', '70000000000000000000', '223', '3426380131832338940', '-4319656832346933190529' ],
    // A -> D, T <= 415.8, vt = 34, acc = -1008.28
    [ '-70000000000000000000', '70000000000000000000', '415', '34896255404653271246', '-1008280731961454666274' ],
    // A -> E, vt = 38, acc = 94
    [ '-70000000000000000000', '70000000000000000000', '450', '38761820965682039178', '94115523443198604972' ],

    // upward part B
    // lastEMAPremium(v0) -> 7000 * (1-0.2%) - 7000 (* markPrice = index * (1-0.2%) *)
    // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
    // B -> B, T <= 40, vt = -3, acc = -210
    [ '-14000000000000000000', '70000000000000000000', '40', '-3514549723721562091', '-210877808021670251100' ],
    // B -> C, T <= 70, vt = 3, acc = -210
    [ '-14000000000000000000', '70000000000000000000', '70', '3481290799061908523', '-210892357745391813192' ],
    // B -> D, T <= 262, vt = 34, acc = 3108
    [ '-14000000000000000000', '70000000000000000000', '262', '34925209366324635286', '3108228821993097906377' ],
    // B -> E, vt = 39, acc = 4305
    [ '-14000000000000000000', '70000000000000000000', '300', '39098155554478714217', '4305154031359422541663' ],

    // upward part C
    // lastEMAPremium(v0) -> 7000 * (1-0.02%) - 7000 (* markPrice = index * (1-0.02%) *)
    // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
    // C -> C, T <= 21, vt = 3, acc = 0
    [ '-1400000000000000000', '70000000000000000000', '21', '3427085573633748559', '0' ],
    // C -> D, T <= 213, vt = 34, acc = 3311
    [ '-1400000000000000000', '70000000000000000000', '213', '34896627378550328410', '3311475602048935027368' ],
    // C -> E, vt = 38, acc = 4476
    [ '-1400000000000000000', '70000000000000000000', '250', '38969711855767328378', '4476872229427485355779' ],

    // upward part D
    // lastEMAPremium(v0) -> 7000 * (1+0.2%) - 7000 (* markPrice = index * (1+0.2%) *)
    // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
    // D -> D, T <= 141, vt = 34, acc = 3066
    [ '14000000000000000000', '70000000000000000000', '141', '34999888207727589228', '3066033593577860118480' ],
    // D -> E, vt = 36, acc = 3349
    [ '14000000000000000000', '70000000000000000000', '150', '36034298780984053767', '3349533481785587707709' ],

    // upward part E
    // lastEMAPremium(v0) -> 7000 * (1+2%) - 7000 (* markPrice = index * (1+0.7%) *)
    // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
    // E -> E, vt = 49, acc = 315
    [ '49000000000000000000', '70000000000000000000', '10', '49688462516778235676', '315000000000000000000' ],

    // downward part B
    // lastEMAPremium(v0) -> 7000 * (1-0.07%) - 7000 (* markPrice = index * (1-0.07%) *)
    // lastPremium -> 7000 * -1% (* markPrice = index * 99% *)
    // B -> A, T > 186, vt = -35, acc = -3361
    [ '-4900000000000000000', '-70000000000000000000', '187', '-35096376859998840421', '-3361488753570349433398' ],
    // critical conditions
    [ '-4900000000000000000', '-70000000000000000000', '186', '-34979837216793494299', '-3330008916353555939098' ],

    // downward part C
    // lastEMAPremium(v0) -> 7000 * (1-0.02%) - 7000 (* markPrice = index * (1-0.02%) *)
    // lastPremium -> 7000 * -1% (* markPrice = index * 99% *)
    // C -> B, T > 10, vt = -4, acc = -0
    [ '-1400000000000000000', '-70000000000000000000', '12', '-4089846915271522775', '-518757180982835053' ],
    // C -> A, T > 202, vt = -40, acc = -4857
    [ '-1400000000000000000', '-70000000000000000000', '250', '-40186585900639197854', '-4854922159631563784171' ],

    // downward part D
    // lastEMAPremium(v0) -> 7000 * (1+0.07%) - 7000 (* markPrice = index * (1+0.07%) *)
    // lastPremium -> 7000 * -1% (* markPrice = index * 99% *)
    // D -> C, T > 6, vt = 3, acc = 4
    [ '4900000000000000000', '-70000000000000000000', '7', '3172563533094860525', '4677779033892501070' ],
    // D -> B, T > 36, vt = -3, acc = 4
    [ '4900000000000000000', '-70000000000000000000', '37', '-3790732672140452279', '4608112362846738456' ],
    // D -> A, T > 229, vt = -35, acc = -3389
    [ '4900000000000000000', '-70000000000000000000', '230', '-35204554075488539487', '-3389950180306064739192' ],

    // downward part E
    // lastEMAPremium(v0) -> 7000 * (1+2%) - 7000 (* markPrice = index * (1+2%) *)
    // lastPremium -> 7000 * -1% (* markPrice = index * 99% *)
    // E -> D, T > 208, vt = 34, acc = 6583
    [ '140000000000000000000', '-70000000000000000000', '209', '34631036009018359602', '6583480388383005065348' ],
    // E -> C, T > 315, vt = 3, acc = 8151
    [ '140000000000000000000', '-70000000000000000000', '316', '3242307262417739864', '8151306520868855784490' ],
    // E -> B, T > 345, vt = -3, acc = 8151
    [ '140000000000000000000', '-70000000000000000000', '346', '-3727625942018965057', '8151300171634876822912' ],
    // E -> A, T > 538, vt = -35, acc = 4765
    [ '140000000000000000000', '-70000000000000000000', '539', '-35171389128887612720', '4765706109232913532243' ],

    // initial conditions
    // lastEMAPremium(v0) -> 7000 * 99% - 7000 (* markPrice = index * 99% *)
    // lastPremium -> -7000 * 1% (* markPrice = index * 99% *)
    // vt = -70, acc = -1890
    [ '-70000000000000000000', '-70000000000000000000', '60', '-70000000000000000000', '-1890000000000000000000' ],
    // lastEMAPremium(v0) -> 0 (* markPrice = 0 *)
    // lastPremium -> 0 (* markPrice = 0 *)
    // vt = 0, acc = 0
    [ '0', '0', '60', '0', '0' ],
    // lastEMAPremium(v0) -> 7000 * 101% - 7000 (* markPrice = index * 101% *)
    // lastPremium -> 7000 * 1% (* markPrice = index * 101% *)
    // vt = 70, acc = 1890
    [ '70000000000000000000', '70000000000000000000', '60', '70000000000000000000', '1890000000000000000000' ]
  ]

  const gov: FundingGovParams = {
    markPremiumLimit: getBN(markPremiumLimit),
    fundingDampener: getBN(fundingDampener),
    emaAlpha: getBN(emaAlpha)
  }
  let fundingParams: FundingParams = {
    accumulatedFundingPerContract: _0,
    lastEMAPremium: _0,
    lastPremium: _0,
    lastIndexPrice: getBN(getAccumulatedFundingCase1IndexPrice),
    lastFundingTimestamp: 0
  }

  getAccumulatedFundingCase1.forEach((element, index) => {
    const lastEMAPremium = getBN(element[0])
    const lastPremium = getBN(element[1])
    const timestamp = parseInt(element[2])
    const expectedVT = getBN(element[3])
    const expectedAcc = getBN(element[4])

    it(`computeAccumulatedFunding.${index}:"${lastEMAPremium} ${lastPremium} ${timestamp}"`, function() {
      fundingParams.lastEMAPremium = lastEMAPremium
      fundingParams.lastPremium = lastPremium

      const { acc, emaPremium } = computeAccumulatedFunding(fundingParams, gov, timestamp)

      expect(acc).toApproximate(expectedAcc)
      expect(emaPremium).toApproximate(expectedVT)
    })
  })

  const perpetualStorage: PerpetualStorage = {
    collateralTokenAddress: 'xxxx',
    totalSize: new BigNumber('1000'),
    longSocialLossPerContract: new BigNumber('0.1'),
    shortSocialLossPerContract: new BigNumber('0.5'),
    isEmergency: false,
    isGlobalSettled: false,
    globalSettlePrice: new BigNumber(0),
    fundingParams: fundingParams
  }

  getAccumulatedFundingCase1.forEach((element, index) => {
    const lastEMAPremium = getBN(element[0])
    const lastPremium = getBN(element[1])
    const timestamp = parseInt(element[2])
    const expectedEMAPremium = getBN(element[3])
    const expectedAcc = getBN(element[4])
    const newIndexPrice = new BigNumber('10000')
    const newFariPrice = new BigNumber('10100')

    it(`funding.${index}:"${perpetualStorage.fundingParams.lastEMAPremium} ${perpetualStorage.fundingParams
      .lastPremium} ${timestamp}"`, function() {
      fundingParams.lastEMAPremium = lastEMAPremium
      fundingParams.lastPremium = lastPremium

      const accumulatedFundingPerContract = expectedAcc.div(fundingParams.lastIndexPrice).div(FUNDING_TIME)
      const expectedNewParams: FundingParams = {
        accumulatedFundingPerContract,
        lastFundingTimestamp: timestamp,
        lastEMAPremium: expectedEMAPremium,
        lastPremium: newFariPrice.minus(newIndexPrice),
        lastIndexPrice: newIndexPrice
      }

      const newStroage = funding(perpetualStorage, gov, timestamp, newIndexPrice, newFariPrice)
      const newParams = newStroage.fundingParams

      expect(newParams.accumulatedFundingPerContract).toApproximate(expectedNewParams.accumulatedFundingPerContract)
      expect(newParams.lastEMAPremium).toApproximate(expectedNewParams.lastEMAPremium)
      expect(newParams.lastPremium).toBeBigNumber(expectedNewParams.lastPremium)
      expect(newParams.lastIndexPrice).toBeBigNumber(expectedNewParams.lastIndexPrice)
      expect(expectedNewParams.lastFundingTimestamp).toEqual(newParams.lastFundingTimestamp)
    })
  })

  it('Bad Timestamp', function() {
    const fp: FundingParams = {
      accumulatedFundingPerContract: _0,
      lastEMAPremium: _0,
      lastPremium: _0,
      lastIndexPrice: getBN(getAccumulatedFundingCase1IndexPrice),
      lastFundingTimestamp: 20000
    }
    expect((): void => {
      computeFunding(fp, govParams, 10000)
    }).toThrow()
  })
})

const govParams: GovParams = {
  withdrawalLockBlockCount: 2,
  brokerLockBlockCount: 2,
  intialMargin: new BigNumber(0.1),
  maintenanceMargin: new BigNumber(0.05),
  liquidationSafetyFactor: new BigNumber(0.1),
  liquidationPenaltyRate: new BigNumber(0.01),
  penaltyFundRate: new BigNumber(0.2),
  makerDevRate: new BigNumber(-0.0005),
  takerDevRate: new BigNumber(0.0015),
  oracleAddress: '0x123456',
  ammFeeRate: new BigNumber(0.001),
  markPremiumLimit: new BigNumber('0.005'), //0.5%
  fundingDampener: new BigNumber('0.0005'), // 0.05%
  emaAlpha: getBN('3327787021630616') // 2 / (600 + 1)
}
//[ '-70000000000000000000', '70000000000000000000', '86', '-35106643857103393523', '-2709000000000000000000' ],
const fundingParams: FundingParams = {
  accumulatedFundingPerContract: new BigNumber('10'),
  lastEMAPremium: getBN('-70000000000000000000'),
  lastPremium: getBN('70000000000000000000'),
  lastIndexPrice: getBN('7000000000000000000000'),
  lastFundingTimestamp: 1579601290
}

const duration = 86
const timestamp = fundingParams.lastFundingTimestamp + duration

//const expectedEMAPremium = getBN('-35106643857103393523')
//const expectedACC = getBN('-2709000000000000000000')
//const exepectedMarkPrice = fundingParams.lastIndexPrice.plus(expectedEMAPremium) // 6964.893356142896606477
//const acc = expectedACC.div(fundingParams.lastIndexPrice).div(FUNDING_TIME) // -0.0000134375
//const accumulatedFundingPerContract = fundingParams.accumulatedFundingPerContract.plus(acc) //9.9999865625
//console.log(acc.toString(), accumulatedFundingPerContract.toString())

const perpetualStorage: PerpetualStorage = {
  collateralTokenAddress: 'xxxx',
  totalSize: new BigNumber('1000'),
  longSocialLossPerContract: new BigNumber('0.1'),
  shortSocialLossPerContract: new BigNumber('0.5'),
  isEmergency: false,
  isGlobalSettled: false,
  globalSettlePrice: new BigNumber(0),
  fundingParams: fundingParams
}

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountStorage2: AccountStorage = {
  cashBalance: new BigNumber('1000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountStorage3: AccountStorage = {
  cashBalance: new BigNumber('14000'),
  positionSide: SIDE.Sell,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountStorage4: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Flat,
  positionSize: _0,
  entryValue: _0,
  entrySocialLoss: _0,
  entryFundingLoss: _0,
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

describe('computeAccount', function() {
  interface ComputeAccountCase {
    input: {
      accountStorage: AccountStorage
      govParams: GovParams
      perpetualStorage: PerpetualStorage
      timestamp: number
    }
    expectedOuput: AccountComputed
  }

  const expectOutput1: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.2547191286622'),
    positionMargin: new BigNumber('1601.9254719128662'),
    maintenanceMargin: new BigNumber('800.9627359564331'),
    socialLoss: new BigNumber('0.13'),
    fundingLoss: new BigNumber('23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.0247191286622'),
    pnl2: new BigNumber('13694.9847500349122'),
    roe: new BigNumber('1.36949847500349122'),
    liquidationPrice: _0,
    marginBalance: new BigNumber('23694.9847500349122'),
    maxWithdrawable: new BigNumber('22093.05927812204597'),
    availableMargin: new BigNumber('22083.05927812204597'),
    withdrawableBalance: new BigNumber('10'),
    leverage: new BigNumber('0.676060984555183532'),
    isSafe: true,
    inverseSide: SIDE.Sell,
    inverseEntryPrice: new BigNumber('0.000999900009999'),
    inverseLiquidationPrice: new BigNumber(Infinity)
  }

  const expectOutput2: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.2547191286622'),
    positionMargin: new BigNumber('1601.9254719128662'),
    maintenanceMargin: new BigNumber('800.9627359564331'),
    socialLoss: new BigNumber('0.13'),
    fundingLoss: new BigNumber('23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.0247191286622'),
    pnl2: new BigNumber('13694.9847500349122'),
    roe: new BigNumber('13.6949847500349122'),
    liquidationPrice: new BigNumber('606.07321239988558'),
    marginBalance: new BigNumber('14694.9847500349122'),
    maxWithdrawable: new BigNumber('13093.05927812204598'),
    availableMargin: new BigNumber('13083.05927812204598'),
    withdrawableBalance: new BigNumber('10'),
    leverage: new BigNumber('1.090117138031777'),
    isSafe: true,
    inverseSide: SIDE.Sell,
    inverseEntryPrice: new BigNumber('0.000999900009999'),
    inverseLiquidationPrice: new BigNumber('0.001649965679955')
  }

  const expectOutput3: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.2547191286622'),
    positionMargin: new BigNumber('1601.9254719128662'),
    maintenanceMargin: new BigNumber('800.9627359564331'),
    socialLoss: new BigNumber('1.05'),
    fundingLoss: new BigNumber('-23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    pnl1: new BigNumber('-13719.0247191286622'),
    pnl2: new BigNumber('-13696.164750034912'),
    roe: new BigNumber('-0.97829748214535087'),
    liquidationPrice: new BigNumber('6759.0434654632505176'),
    marginBalance: new BigNumber('303.8352499650878'),
    maxWithdrawable: _0,
    availableMargin: _0,
    withdrawableBalance: _0,
    leverage: new BigNumber('52.72348985500976'),
    isSafe: false,
    inverseSide: SIDE.Buy,
    inverseEntryPrice: new BigNumber('0.0009999000099990001'),
    inverseLiquidationPrice: new BigNumber('0.00014794992887820734')
  }

  const expectOutput4: AccountComputed = {
    entryPrice: _0,
    positionValue: _0,
    positionMargin: _0,
    maintenanceMargin: _0,
    socialLoss: _0,
    fundingLoss: _0, // 9.9999865625 * 2.3 -(-0.91)
    pnl1: _0,
    pnl2: _0,
    roe: _0,
    liquidationPrice: _0,
    marginBalance: new BigNumber('10000'),
    availableMargin: new BigNumber('9990'),
    maxWithdrawable: new BigNumber('10000'),
    withdrawableBalance: new BigNumber('10'),
    leverage: _0,
    isSafe: true,
    inverseSide: SIDE.Flat,
    inverseEntryPrice: _0,
    inverseLiquidationPrice: _0
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      input: {
        accountStorage: accountStorage1,
        perpetualStorage: perpetualStorage,
        govParams: govParams,
        timestamp: timestamp
      },
      expectedOuput: expectOutput1
    },
    {
      input: {
        accountStorage: accountStorage2,
        perpetualStorage: perpetualStorage,
        govParams: govParams,
        timestamp: timestamp
      },
      expectedOuput: expectOutput2
    },
    {
      input: {
        accountStorage: accountStorage3,
        perpetualStorage: perpetualStorage,
        govParams: govParams,
        timestamp: timestamp
      },
      expectedOuput: expectOutput3
    },
    {
      input: {
        accountStorage: accountStorage4,
        perpetualStorage: perpetualStorage,
        govParams: govParams,
        timestamp: timestamp
      },
      expectedOuput: expectOutput4
    }
  ]

  successCases.forEach((element, index) => {
    it(`computeAccount.${index}`, function() {
      const input = element.input
      const expectedOutput = element.expectedOuput
      const fundingResult = computeFunding(input.perpetualStorage.fundingParams, input.govParams, input.timestamp)
      const accountDetails = computeAccount(
        input.accountStorage,
        input.govParams,
        input.perpetualStorage,
        fundingResult
      )
      const computed = accountDetails.accountComputed
      expect(computed.entryPrice).toBeBigNumber(expectedOutput.entryPrice)
      expect(computed.positionValue).toApproximate(expectedOutput.positionValue)
      expect(computed.positionMargin).toApproximate(expectedOutput.positionMargin)
      expect(computed.maintenanceMargin).toApproximate(expectedOutput.maintenanceMargin)
      expect(computed.socialLoss).toBeBigNumber(expectedOutput.socialLoss)
      expect(computed.fundingLoss).toApproximate(expectedOutput.fundingLoss)
      expect(computed.pnl1).toApproximate(expectedOutput.pnl1)
      expect(computed.pnl2).toApproximate(expectedOutput.pnl2)
      expect(computed.roe).toApproximate(expectedOutput.roe)
      expect(computed.liquidationPrice).toApproximate(expectedOutput.liquidationPrice)
      expect(computed.marginBalance).toApproximate(expectedOutput.marginBalance)
      expect(computed.availableMargin).toApproximate(expectedOutput.availableMargin)
      expect(computed.maxWithdrawable).toApproximate(expectedOutput.maxWithdrawable)
      expect(computed.withdrawableBalance).toApproximate(expectedOutput.withdrawableBalance)
      expect(computed.leverage).toApproximate(expectedOutput.leverage)
      expect(computed.isSafe).toEqual(expectedOutput.isSafe)
      expect(computed.inverseSide).toEqual(expectedOutput.inverseSide)
      expect(computed.inverseEntryPrice).toApproximate(expectedOutput.inverseEntryPrice)
      expect(computed.inverseLiquidationPrice).toApproximate(expectedOutput.inverseLiquidationPrice)
    })
  })
})

describe('amm', function() {
  const fundingResult = computeFunding(perpetualStorage.fundingParams, govParams, timestamp)

  const ammStorage: AccountStorage = {
    cashBalance: new BigNumber('10000'),
    positionSide: SIDE.Buy,
    positionSize: new BigNumber('2.3'),
    entryValue: new BigNumber('2300.23'),
    entrySocialLoss: new BigNumber('0.1'),
    entryFundingLoss: new BigNumber('-0.91'),
    withdrawalApplication: {
      amount: new BigNumber('10'),
      height: 123
    }
  }

  const ammDetails = computeAMM(ammStorage, govParams, perpetualStorage, fundingResult)

  it('computeAMM', function() {
    //socialLoss: new BigNumber('0.13'),
    //fundingLoss: new BigNumber('23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    // 10000 - 2300.23 - 0.13 - 23.90996909375
    expect(ammDetails.ammComputed.availableMargin).toApproximate(new BigNumber(7675.73003090625))
    expect(ammDetails.ammComputed.fairPrice).toApproximate(new BigNumber(3337.273926480978))
    expect(ammDetails.ammComputed.inverseFairPrice).toApproximate(new BigNumber(1 / 3337.273926480978))
  })

  it(`computeAMMPrice.buyTooLarge`, function() {
    expect((): void => {
      computeAMMPrice(ammDetails, SIDE.Buy, 4)
    }).toThrow()
  })

  it(`computeAMMPrice.buy`, function() {
    const price = computeAMMPrice(ammDetails, SIDE.Buy, 0.5)
    expect(price).toApproximate(new BigNumber(4264.294461614583333))
  })

  it(`computeAMMPrice.sell`, function() {
    const price = computeAMMPrice(ammDetails, SIDE.Sell, 0.5)
    expect(price).toApproximate(new BigNumber(2741.332153895089))
  })

  it('computeAMMDepth', function() {
    const depth = computeAMMDepth(ammDetails, 0.1, 3)

    expect(depth.bids.length).toEqual(4)
    expect(depth.asks.length).toEqual(4)

    expect(depth.bids[0].price).toApproximate(new BigNumber(2952.20385804086538))
    expect(depth.bids[0].amount).toApproximate(new BigNumber(0.3))
    expect(depth.bids[1].price).toApproximate(new BigNumber(3070.2920123625))
    expect(depth.bids[1].amount).toApproximate(new BigNumber(0.2))
    expect(depth.bids[2].price).toApproximate(new BigNumber(3198.2208462109375))
    expect(depth.bids[2].amount).toApproximate(new BigNumber(0.1))
    expect(depth.bids[3].price).toApproximate(new BigNumber(3337.273926480978))
    expect(depth.bids[3].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[0].price).toApproximate(new BigNumber(3337.273926480978))
    expect(depth.asks[0].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[1].price).toApproximate(new BigNumber(3488.968195866477))
    expect(depth.asks[1].amount).toApproximate(new BigNumber(0.1))
    expect(depth.asks[2].price).toApproximate(new BigNumber(3655.109538526786))
    expect(depth.asks[2].amount).toApproximate(new BigNumber(0.2))
    expect(depth.asks[3].price).toApproximate(new BigNumber(3837.865015453125))
    expect(depth.asks[3].amount).toApproximate(new BigNumber(0.3))
  })

  it('computeAMMDepthDefault', function() {
    const depth = computeAMMDepth(ammDetails)

    expect(depth.bids.length).toEqual(21)
    expect(depth.asks.length).toEqual(21)
  })

  it('computeAMMDepthTooLarge', function() {
    const depth = computeAMMDepth(ammDetails, 1)

    expect(depth.bids.length).toEqual(21)
    expect(depth.asks.length).toEqual(3)
  })

  it(`computeAMMInversePrice.sellTooLarge`, function() {
    expect((): void => {
      computeAMMInversePrice(ammDetails, SIDE.Sell, 4)
    }).toThrow()
  })

  it('computeAMMInverseDepth', function() {
    const depth = computeAMMInverseDepth(ammDetails, 0.1, 3)

    expect(depth.bids.length).toEqual(4)
    expect(depth.asks.length).toEqual(4)

    expect(depth.bids[0].price).toApproximate(new BigNumber(1 / 3837.865015453125))
    expect(depth.bids[0].amount).toApproximate(new BigNumber(0.3))
    expect(depth.bids[1].price).toApproximate(new BigNumber(1 / 3655.109538526786))
    expect(depth.bids[1].amount).toApproximate(new BigNumber(0.2))
    expect(depth.bids[2].price).toApproximate(new BigNumber(1 / 3488.968195866477))
    expect(depth.bids[2].amount).toApproximate(new BigNumber(0.1))
    expect(depth.bids[3].price).toApproximate(new BigNumber(1 / 3337.273926480978))
    expect(depth.bids[3].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[0].price).toApproximate(new BigNumber(1 / 3337.273926480978))
    expect(depth.asks[0].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[1].price).toApproximate(new BigNumber(1 / 3198.2208462109375))
    expect(depth.asks[1].amount).toApproximate(new BigNumber(0.1))
    expect(depth.asks[2].price).toApproximate(new BigNumber(1 / 3070.2920123625))
    expect(depth.asks[2].amount).toApproximate(new BigNumber(0.2))
    expect(depth.asks[3].price).toApproximate(new BigNumber(1 / 2952.20385804086538))
    expect(depth.asks[3].amount).toApproximate(new BigNumber(0.3))
  })

  it('computeAMMInverseDepthDefault', function() {
    const depth = computeAMMInverseDepth(ammDetails)

    expect(depth.bids.length).toEqual(21)
    expect(depth.asks.length).toEqual(21)
  })

  it('computeAMMInverseDepthTooLarge', function() {
    const depth = computeAMMInverseDepth(ammDetails, 1)

    expect(depth.bids.length).toEqual(3)
    expect(depth.asks.length).toEqual(21)
  })
})

describe('computeTrade', function() {
  const fundingResult = computeFunding(perpetualStorage.fundingParams, govParams, timestamp)
  const accountDetails1 = computeAccount(accountStorage1, govParams, perpetualStorage, fundingResult)
  /*
  const accountDetails2 = computeAccount(accountStorage2, govParams, perpetualStorage, fundingResult)
  const accountDetails3 = computeAccount(accountStorage3, govParams, perpetualStorage, fundingResult)
  const accountDetails4 = computeAccount(accountStorage4, govParams, perpetualStorage, fundingResult)
  */

  it('decrease.FlatSide', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage4, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('decrease.ZeroPrice', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('decrease.ZeroAmount', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('decrease.LargeAmount', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _1, _1000)
    }).toThrow()
  })

  it('increase.FlatSide', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Flat, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('increase.ZeroPrice', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Buy, _0, _1)
    }).toThrow()
  })

  it('increase.ZeroAmount', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Buy, _1, _0)
    }).toThrow()
  })

  it('increase.BadSide', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Sell, _1, _0)
    }).toThrow()
  })

  it('fee.ZeroPrice', function() {
    expect((): void => {
      computeFee(0, 1, 0.1)
    }).toThrow()
  })

  it('fee.ZeroAmount', function() {
    expect((): void => {
      computeFee(1, 0, 0.1)
    }).toThrow()
  })

  it('tradeCost.ZeroAmount', function() {
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, SIDE.Buy, _1, _0, _1, _0_01)
    }).toThrow()
  })

  it('tradeCost.ZeroPrice', function() {
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, SIDE.Buy, _0, _1, _1, _0_01)
    }).toThrow()
  })

  it('tradeCost.BadLev', function() {
    expect((): void => {
      computeTradeCost(
        govParams,
        perpetualStorage,
        fundingResult,
        accountDetails1,
        SIDE.Buy,
        _1,
        _1,
        _1.negated(),
        _0_01
      )
    }).toThrow()
  })

  interface TradeCostCase {
    input: {
      accountDetails: AccountDetails
      side: SIDE
      price: BigNumberish
      amount: BigNumberish
      leverage: BigNumberish
      feeRate: BigNumberish
    }
    expectedOutput: {
      account: {
        cashBalance: BigNumberish
        positionSide: SIDE
        positionSize: BigNumberish
        entryValue: BigNumberish
        entrySocialLoss: BigNumberish
        entryFundingLoss: BigNumberish
      }
      marginCost: BigNumberish
      toDeposit: BigNumberish
      fee: BigNumberish
    }
  }
  const tradeCostCases: Array<TradeCostCase> = [
    {
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Buy,
        price: 2000,
        amount: 1,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          cashBalance: 0,
          positionSide: SIDE.Buy,
          positionSize: 0,
          entryValue: 0,
          entrySocialLoss: 0,
          entryFundingLoss: 0
        },
        marginCost: 0,
        toDeposit: 0,
        fee: 20
      }
    }
  ]

  tradeCostCases.forEach((element, index) => {
    const input = element.input
    const expectedOutput = element.expectedOutput

    it(`tradeCost.case.${index}`, function() {
      const tradeCost = computeTradeCost(
        govParams,
        perpetualStorage,
        fundingResult,
        input.accountDetails,
        input.side,
        input.price,
        input.amount,
        input.leverage,
        input.feeRate
      )
      expect(tradeCost.account.accountStorage.cashBalance).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.cashBalance)
      )
      expect(expectedOutput.account.positionSide).toEqual(tradeCost.account.accountStorage.positionSide)
      expect(tradeCost.account.accountStorage.positionSize).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.positionSize)
      )
      expect(tradeCost.account.accountStorage.entryValue).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.entryValue)
      )
      expect(tradeCost.account.accountStorage.entrySocialLoss).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.entrySocialLoss)
      )
      expect(tradeCost.account.accountStorage.entryFundingLoss).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.entryFundingLoss)
      )
      expect(tradeCost.marginCost).toBeBigNumber(normalizeBigNumberish(expectedOutput.marginCost))
      expect(tradeCost.toDeposit).toBeBigNumber(normalizeBigNumberish(expectedOutput.toDeposit))
      expect(tradeCost.fee).toBeBigNumber(normalizeBigNumberish(expectedOutput.fee))
    })
  })
})
