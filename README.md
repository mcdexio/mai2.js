# mai2.js - Mai Protocol v2 JavaScript API

![CoverageStatus](https://github.com/mcdexio/mai2.js/workflows/Coverage/badge.svg)

## Install
```
npm install @mcdex/mai2.js
```

## Quick start

1. Connecting to Ethereum

```
import { ethers } from 'ethers'
const provider = ethers.getDefaultProvider('homestead')
```

2. Get a user's position size

```
import { getContractReader, getAccountStorage } from '@mcdex/mai2.js'
const perpetualAddress = '0x220a9f0DD581cbc58fcFb907De0454cBF3777f76' // NOTE: this is a Perpetual address that may change in the future. Check https://github.com/mcdexio/mai-protocol-v2 for online addresses
const userAddress = '' // Paste your ETH address here
const contractReader = await getContractReader(provider)
const p = await getAccountStorage(contractReader, perpetualAddress, userAddress)
console.log(p.positionSide)
console.log(p.positionSize.toFixed())
```

3. Get a user's margin balance

```
import { getMarginBalance } from '@mcdex/mai2.js'
const m = await getMarginBalance(contractReader, perpetualAddress, userAddress)
console.log(m.toFixed())
```

## Test
```
npm run test
```

### mai2.js devloper only: prepare an env for unit tests

```
ADDRESS_OUTPUT_PATH=/tmp/address.js WRAPPER_OUTPUT_PATH=~/contract/mai2.js/tests/eth_address.ts \
    node_modules/.bin/truffle --network=mai2js_admin migrate --reset --migrations_directory=migrations_mai2js
```
