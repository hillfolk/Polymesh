// Set options as a parameter, environment variable, or rc file.
require = require("esm")(module /*, options*/);
module.exports = require("../util/init.js");

let { reqImports } = require("../util/init.js");

const util = require('util');
const exec = util.promisify(require('child_process').exec);
// Sets the default exit code to fail unless the script runs successfully
process.exitCode = 1;

async function main() {
  const api = await reqImports.createApi();

  const ticker = await reqImports.generateRandomTicker(api);
  const ticker2 = await reqImports.generateRandomTicker(api);
  const tickerHex = reqImports.stringToHex(ticker);
  const ticker2Hex = reqImports.stringToHex(ticker2); 
  const tickerHexSubStr = tickerHex.substr(2);
  const ticker2HexSubStr = ticker2Hex.substr(2);
  const testEntities = await reqImports.initMain(api);
  const CHAIN_DIR = 'chain_dir';

  let alice = testEntities[0];
  let bob = await reqImports.generateRandomEntity(api);
  let charlie = await reqImports.generateRandomEntity(api);

  let alice_did = await reqImports.keyToIdentityIds(api, alice.publicKey);

  let dids = await reqImports.createIdentities(api, [bob, charlie], alice);
  let bob_did = dids[0];
  let charlie_did = dids[1];

  await reqImports.distributePolyBatch(
    api,
    [bob, charlie],
    reqImports.transfer_amount,
    alice
  );

  // Alice creates Confidential Assets 
  await createConfidentialAsset(api, tickerHex, alice);
  await createConfidentialAsset(api, ticker2Hex, alice);

  // Alice and Bob create their Mercat account locally and submit the proof to the chain
  const aliceMercatInfo = await createMercatUserAccount('alice', tickerHexSubStr, ticker2HexSubStr, CHAIN_DIR);
  const bobMercatInfo = await createMercatUserAccount('bob', tickerHexSubStr, ticker2HexSubStr, CHAIN_DIR);

  // Validate Alice and Bob's Mercat Accounts
  await validateMercatAccount(api, alice, aliceMercatInfo.mercatAccountProof);
  await validateMercatAccount(api, bob, bobMercatInfo.mercatAccountProof);

  // Charlie creates his mediator Mercat Account 
  const charlieMercatInfo = await createMercatMediatorAccount('charlie', CHAIN_DIR);

  // Validate Charlie's Mercat Account 
  await addMediatorMercatAccount(api, charlie, charlieMercatInfo);

  let aliceBalance = await displayBalance(api, alice_did, aliceMercatInfo.mercatAccountID, 'alice', tickerHexSubStr, CHAIN_DIR);
  let bobBalance = await displayBalance(api, bob_did, bobMercatInfo.mercatAccountID, 'bob', tickerHexSubStr, CHAIN_DIR);
  
  // Mint Tokens 
  await mintTokens(api, 'alice', alice, tickerHex, 1000, CHAIN_DIR);
  
  aliceBalance = await displayBalance(api, alice_did, aliceMercatInfo.mercatAccountID, 'alice', tickerHexSubStr, CHAIN_DIR);
  bobBalance = await displayBalance(api, bob_did, bobMercatInfo.mercatAccountID, 'bob', tickerHexSubStr, CHAIN_DIR);

  // Create Venue
  const venueCounter = await reqImports.createVenue(api, charlie);
 
  // Create Confidential Instruction
  const instructionCounter = await reqImports.addConfidentialInstruction(
    api,
    venueCounter,
    charlie,
    alice_did,
    bob_did,
    charlie_did,
    aliceMercatInfo.mercatAccountID,
    bobMercatInfo.mercatAccountID
  );
  
  const transactionProof = await createTransaction(
    "alice",
    CHAIN_DIR,
    tickerHexSubStr,
    100,
    { publicKey: bob.publicKey, encryptedAssetId: bobMercatInfo.mercatAccountID },
    charlie,
    aliceBalance
  );

  await affirmConfidentialInstruction(api, instructionCounter, transactionProof, alice, alice_did);

  await finalizeTransaction('bob', tickerHexSubStr, 100, transactionProof, CHAIN_DIR);
  
  // Removes the Chain_Dir
  await removeChainDir(CHAIN_DIR);
  
  if (reqImports.fail_count > 0) {
    console.log("Failed");
  } else {
    console.log("Passed");
    process.exitCode = 0;
  }

  process.exit();
}

function encodeToBase64(data) {
    let buffer = Buffer.from(data);
    return buffer.toString('base64');
}

async function finalizeTransaction(account, tickerHex, amount, proof, dbDir) {
    const { stdout, stderr } = await exec(
        `mercat-interactive finalize-transaction --db-dir ${dbDir} --account-id-from-ticker ${tickerHex} --amount ${amount} --receiver ${account} --init-tx ${proof}`
      );
   
}

async function affirmConfidentialInstruction(api, instruction_id, proof, signer, signer_did) {
    const portfolio = reqImports.getDefaultPortfolio(signer_did);
    const transaction = await api.tx.settlement.affirmConfidentialInstruction(instruction_id, {InitializedTransfer: proof}, [portfolio]);
    let tx = await reqImports.sendTx(signer, transaction);
    if(tx !== -1) reqImports.fail_count--;
}

async function createTransaction(account, dbDir, tickerHex, amount, receiver, mediator, balance) {

    let base64Receiver = encodeToBase64(receiver.publicKey);
    let base64Mediator = encodeToBase64(mediator.publicKey);

    const { stdout, stderr } = await exec(
      `mercat-interactive create-transaction --db-dir ${dbDir} --account-id-from-ticker ${tickerHex} --amount ${amount} --sender ${account} \
      --receiver ${receiver.encryptedAssetId} ${base64Receiver} \
      --mediator ${base64Mediator} \
      --pending-balance ${balance}`
    );
    const splitOutput = stderr.split('\n');
    const transactionProof = splitOutput[22].trim();

    return transactionProof;
}

async function displayBalance(api, did, mercatAccountID, account, tickerHex, dbDir) {
    // Get encrypted balance
    const accountEncryptedBalance = await getEncryptedBalance(api, did, mercatAccountID);
    // Decrypt balance
    const accountBalance = await decryptBalances(account, tickerHex, accountEncryptedBalance, dbDir);
    console.log(`${account}'s Balance: ${accountBalance}`);

    return accountEncryptedBalance;
}

async function mintTokens(api, account, signer, tickerHex, amount, dbDir) {
    await exec('mkdir chain_dir/on-chain/common');
    const { stdout, stderr } = await exec(`mercat-interactive mint --db-dir ${dbDir} --amount ${amount} --issuer ${account} --account-id-from-ticker ${tickerHex.substr(2)}`);
    const splitOutput = stderr.split('\n');
    const mintProof = splitOutput[19].trim();

    const transaction = await api.tx.confidentialAsset.mintConfidentialAsset(tickerHex, amount, mintProof);
    let tx = await reqImports.sendTx(signer, transaction);
    if(tx !== -1) reqImports.fail_count--;
}

async function getEncryptedBalance(api, did, mercatAccountID){
    return await api.query.confidentialAsset.mercatAccountBalance(did, mercatAccountID);
}

async function decryptBalances(account, tickerHex, encryptedBalance, dbDir) {
    const { stdout, stderr } = await exec(
      `mercat-interactive decrypt --db-dir ${dbDir} --ticker ${tickerHex} --user ${account} --encrypted-value ${encryptedBalance}`
    );
    const splitOutput = stderr.split('\n');
    return splitOutput[11].substr(65).trim();
}

async function removeChainDir(chain_dir) {
    await exec(`rm -rf ${chain_dir}`);
}

async function addMediatorMercatAccount(api, signer, public_key) {
    const transaction = await api.tx.confidentialAsset.addMediatorMercatAccount(public_key);
    
    let tx = await reqImports.sendTx(signer, transaction);
    if(tx !== -1) reqImports.fail_count--;
}

async function validateMercatAccount(api, signer, proof) {
    const transaction = await api.tx.confidentialAsset.validateMercatAccount(proof);
    
    let tx = await reqImports.sendTx(signer, transaction);
    if(tx !== -1) reqImports.fail_count--;
}

async function createMercatUserAccount(account, tickerHex, ticker2Hex, dbDir) {
  const { stdout, stderr } = await exec(
    `mercat-interactive create-user-account --user ${account} --db-dir ${dbDir} --ticker ${tickerHex} --valid-ticker-names ${tickerHex} ${ticker2Hex}`
  );

  const splitOutput = stderr.split('\n');
  const mercatAccountID = splitOutput[21].trim();
  const mercatAccountProof = splitOutput[24].trim();

  return {mercatAccountID, mercatAccountProof};
}

async function createMercatMediatorAccount(account, dbDir) {
    const { stdout, stderr } = await exec(
      `mercat-interactive create-mediator-account  --db-dir ${dbDir} --user ${account}`
    );
    const splitOutput = stderr.split('\n');
    
    return splitOutput[15].trim();
  }

async function createConfidentialAsset(api, ticker, signer) {

    const transaction = await api.tx.confidentialAsset.createConfidentialAsset(
        ticker,
        ticker,
        true,
        0,
        [],
        null
      );
    
      let tx = await reqImports.sendTx(signer, transaction);
      if(tx !== -1) reqImports.fail_count--;
}

main().catch(console.error);