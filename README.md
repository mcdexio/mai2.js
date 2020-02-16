# mai2.js - Mai Protocol v2 JavaScript API



### mai2.js devloper only: prepare an env for unit tests

```
truffle --network=mai2js_admin migrate
truffle --network=mai2js_admin exec scripts/mint_test_token.js          # mint some test token to u1 & u2
truffle --network=mai2js_u7 exec scripts/create_pool_for_test_token.js  # approve u1, and create_pool
truffle --network=mai2js_u2 exec scripts/approve_test_token.js          # approve u2
```
