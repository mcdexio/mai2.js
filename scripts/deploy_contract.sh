export MAI2JS_HOME=$(pwd)
export ADDRESS_OUTPUT_PATH=/tmp/addresses.json
export WRAPPER_OUTPUT_PATH=${MAI2JS_HOME}/tests/eth_address.ts

git clone https://b48f6bb8411720b36cb7c8eaca1cc569ba73be71@github.com/mcarloai/mai-protocol-v2.git
cd mai-protocol-v2
git checkout v2.5

cnpm install
cnpm run compile

sed -i "s/migrations_directory.*/migrations_directory: \"test_migrations\",/g" truffle.js
cnpm run migrate

cd ${MAI2JS_HOME}