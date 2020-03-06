NPM=npm
PWD=$(pwd)

echo "ADDRESS TMP:" ${ADDRESS_OUTPUT_PATH}
echo "OUTPUT PATH:" ${WRAPPER_OUTPUT_PATH}

git clone https://${CHECKOUT_PAT}@github.com/mcarloai/mai-protocol-v2.git
cd mai-protocol-v2
git checkout v2.5

${NPM} install
${NPM} run compile

sed -i "s/migrations_directory.*/migrations_directory: \"test_migrations\",/g" truffle.js
${NPM} run migrate