import { bigLn } from '../src/utils'
import BigNumber from 'bignumber.js'

describe('bigLn',
  function () {
    const expectError = new BigNumber('10e-18')
    it('ln1.9',
      function () {
        const i = bigLn(new BigNumber('1.975308642024691356'))
        const err = new BigNumber(i).minus('0.680724660586388155').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
    it('ln0.9',
      function () {
        const i = bigLn(new BigNumber('0.987654321012345678'))
        const err = new BigNumber(i).minus('-0.012422519973557154').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
    it('ln1',
      function () {
        const i = bigLn(new BigNumber('1'))
        expect(i.toString()).toEqual('0')
      })
    it('ln0.1',
      function () {
        const i = bigLn(new BigNumber('0.1'))
        const err = new BigNumber(i).minus('-2.302585092994045684').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
    it('ln0.5',
      function () {
        const i = bigLn(new BigNumber('0.5'))
        const err = new BigNumber(i).minus('-0.693147180559945309').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
    it('ln3',
      function () {
        const i = bigLn(new BigNumber('3'))
        const err = new BigNumber(i).minus('1.098612288668109691').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
    it('ln10',
      function () {
        const i = bigLn(new BigNumber('10'))
        const err = new BigNumber(i).minus('2.302585092994045684').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
    it('ln1.2345',
      function () {
        const i = bigLn(new BigNumber('1.2345'))
        const err = new BigNumber(i).minus('0.210666029803097141').abs()
        expect(err.isLessThan(expectError)).toBeTruthy()
      })
  })
