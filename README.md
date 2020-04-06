# mai2.js - Mai Protocol v2 JavaScript API

![CoverageStatus](https://github.com/mcarloai/mai2.js/workflows/Coverage/badge.svg)

## INSTALL
```
npm install @mcdex/mai2.js
```

## TEST
```
npm run test
```

### mai2.js devloper only: prepare an env for unit tests

```
ADDRESS_OUTPUT_PATH=/tmp/address.js WRAPPER_OUTPUT_PATH=~/contract/mai2.js/tests/eth_address.ts \
    node_modules/.bin/truffle --network=mai2js_admin migrate --reset
```
