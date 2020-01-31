import BigNumber from 'bignumber.js'
import { _tFunc, _rFunc, computeAccumulatedFunding, funding } from '../src/computation'
import { _0, _1, FUNDING_TIME, _1000, _0_1, _0_01 } from '../src/constants'
import { FundingGovParams, FundingParams, PerpetualStorage } from '../src/types'
import { extendExpect, getBN } from './helper'

extendExpect()

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

      const accumulatedFundingPerContract = expectedAcc.div(FUNDING_TIME)
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
})
