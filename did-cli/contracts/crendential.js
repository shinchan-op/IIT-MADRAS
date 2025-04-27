const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { executeFunction, queryFunction, calculateHash } = require('../utils/contracts');
const { AccountId } = require('@hashgraph/sdk');
const fs = require('fs');

// Convert Hedera account ID to EVM address if needed
function getEvmAddress(address) {
  if (address.includes('.')) {
    const accountId = AccountId.fromString(address);
    return accountId.toSolidityAddress();
  }
  return address.startsWith('0x') ? address : `0x${address}`;
}

// Issue credential command
const issue = program
  .command('issue')
  .description('Issue a credential to a holder')
  .argument('<holder>', 'Address or account ID of the holder')
  .option('-d, --data <json>', 'Credential data as JSON string')
  .option('-f, --file <path>', 'Path to JSON file containing credential data')
  .option('-t, --duration <blocks>', 'Duration in blocks (0 for no expiration)', '0')
  .option('-s, --schema <id>', 'Schema ID for the credential', '0x0000000000000000000000000000000000000000000000000000000000000000')
  .action(async (holder, options) => {
    const spinner = ora('Issuing credential...').start();
    
    try {
      let credentialData;
      
      if (options.file) {
        credentialData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
      } else if (options.data) {
        credentialData = JSON.parse(options.data);
      } else {
        throw new Error('Credential data required. Use --data or --file option.');
      }
      
      const credentialHash = calculateHash(credentialData);
      const durationInBlocks = parseInt(options.duration, 10);
      const schemaId = options.schema;
      const holderAddress = getEvmAddress(holder);
      
      const result = await executeFunction(
        'issueCredential',
        holderAddress,
        credentialHash,
        durationInBlocks,
        schemaId
      );
      
      spinner.succeed(chalk.green('Credential issued successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
      console.log(chalk.blue('Credential hash:'), credentialHash);
    } catch (error) {
      spinner.fail(chalk.red('Failed to issue credential'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Revoke credential command
const revoke = program
  .command('revoke')
  .description('Revoke a credential')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the credential')
  .action(async (holder, hash) => {
    const spinner = ora('Revoking credential...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const result = await executeFunction('revokeCredential', holderAddress, hash);
      
      spinner.succeed(chalk.green('Credential revoked successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to revoke credential'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Suspend credential command
const suspend = program
  .command('suspend')
  .description('Suspend a credential')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the credential')
  .action(async (holder, hash) => {
    const spinner = ora('Suspending credential...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const result = await executeFunction('suspendCredential', holderAddress, hash);
      
      spinner.succeed(chalk.green('Credential suspended successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to suspend credential'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Unsuspend credential command
const unsuspend = program
  .command('unsuspend')
  .description('Unsuspend a credential')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the credential')
  .action(async (holder, hash) => {
    const spinner = ora('Unsuspending credential...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const result = await executeFunction('unsuspendCredential', holderAddress, hash);
      
      spinner.succeed(chalk.green('Credential unsuspended successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to unsuspend credential'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Update credential command
const update = program
  .command('update')
  .description('Update a credential')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the credential')
  .option('-t, --duration <blocks>', 'New duration in blocks (0 for no expiration)', '0')
  .option('-s, --schema <id>', 'New schema ID for the credential', '0x0000000000000000000000000000000000000000000000000000000000000000')
  .action(async (holder, hash, options) => {
    const spinner = ora('Updating credential...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      const durationInBlocks = parseInt(options.duration, 10);
      const schemaId = options.schema;
      
      const result = await executeFunction(
        'updateCredential',
        holderAddress,
        hash,
        durationInBlocks,
        schemaId
      );
      
      spinner.succeed(chalk.green('Credential updated successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to update credential'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Get credential command
const get = program
  .command('get')
  .description('Get credential information')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the credential')
  .action(async (holder, hash) => {
    const spinner = ora('Getting credential information...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const credInfo = await queryFunction('getCredential', holderAddress, hash);
      
      spinner.stop();
      
      console.log(chalk.green('Credential information:'));
      console.log(chalk.blue('Issuer:'), credInfo.issuer);
      console.log(chalk.blue('Valid:'), credInfo.valid ? 'Yes' : 'No');
      console.log(chalk.blue('Suspended:'), credInfo.suspended ? 'Yes' : 'No');
      console.log(chalk.blue('Expiration Block:'), credInfo.expirationBlock.toString());
      console.log(chalk.blue('Schema ID:'), credInfo.schemaId);
      console.log(chalk.blue('Version:'), credInfo.version.toString());
    } catch (error) {
      spinner.fail(chalk.red('Failed to get credential information'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Verify credential command
const verify = program
  .command('verify')
  .description('Verify a credential')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the credential')
  .action(async (holder, hash) => {
    const spinner = ora('Verifying credential...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const isValid = await queryFunction('verifyCredential', holderAddress, hash);
      
      spinner.stop();
      
      if (isValid[0]) {
        console.log(chalk.green('✓ Credential is valid'));
      } else {
        console.log(chalk.yellow('✗ Credential is not valid'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to verify credential'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

module.exports = {
  issue,
  revoke,
  suspend,
  unsuspend,
  update,
  get,
  verify
};
