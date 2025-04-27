const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { executeFunction, queryFunction } = require('../utils/contracts');
const { getClient } = require('../utils/hedera');
const { AccountId } = require('@hashgraph/sdk');

// Create DID command
const create = program
  .command('create')
  .description('Create a new DID')
  .argument('<publicKey>', 'Public key for the DID')
  .action(async (publicKey) => {
    const spinner = ora('Creating DID...').start();
    
    try {
      const result = await executeFunction('createDID', publicKey);
      
      spinner.succeed(chalk.green('DID created successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
      
      // Show the operator account ID
      const client = getClient();
      console.log(chalk.blue('DID holder:'), client.operatorAccountId.toString());
    } catch (error) {
      spinner.fail(chalk.red('Failed to create DID'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Update DID command
const update = program
  .command('update')
  .description('Update an existing DID')
  .argument('<newPublicKey>', 'New public key for the DID')
  .action(async (newPublicKey) => {
    const spinner = ora('Updating DID...').start();
    
    try {
      const result = await executeFunction('updateDID', newPublicKey);
      
      spinner.succeed(chalk.green('DID updated successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to update DID'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Get DID command
const get = program
  .command('get')
  .description('Get DID information')
  .argument('[address]', 'DID address (defaults to your address)')
  .action(async (address) => {
    const spinner = ora('Fetching DID information...').start();
    
    try {
      // If no address provided, use the operator account
      if (!address) {
        const client = getClient();
        address = client.operatorAccountId.toString();
      }
      
      // Convert to EVM address if in Hedera format (0.0.xxx)
      let evmAddress = address;
      if (address.includes('.')) {
        const accountId = AccountId.fromString(address);
        evmAddress = accountId.toSolidityAddress();
      }
      
      const didInfo = await queryFunction('dids', evmAddress);
      
      spinner.stop();
      
      if (didInfo.exists) {
        console.log(chalk.green('DID exists for address:'), address);
        console.log(chalk.blue('Public key:'), didInfo.publicKey);
      } else {
        console.log(chalk.yellow('No DID found for address:'), address);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to get DID information'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

module.exports = {
  create,
  update,
  get
};
