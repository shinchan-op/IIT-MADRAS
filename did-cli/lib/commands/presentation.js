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

// Create presentation command
const create = program
  .command('create')
  .description('Create a presentation')
  .option('-d, --data <json>', 'Presentation data as JSON string')
  .option('-f, --file <path>', 'Path to JSON file containing presentation data')
  .action(async (options) => {
    const spinner = ora('Creating presentation...').start();
    
    try {
      let presentationData;
      
      if (options.file) {
        presentationData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
      } else if (options.data) {
        presentationData = JSON.parse(options.data);
      } else {
        throw new Error('Presentation data required. Use --data or --file option.');
      }
      
      const presentationHash = calculateHash(presentationData);
      
      const result = await executeFunction('createPresentation', presentationHash);
      
      spinner.succeed(chalk.green('Presentation created successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
      console.log(chalk.blue('Presentation hash:'), presentationHash);
    } catch (error) {
      spinner.fail(chalk.red('Failed to create presentation'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Get presentation command
const get = program
  .command('get')
  .description('Get presentation information')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the presentation')
  .action(async (holder, hash) => {
    const spinner = ora('Getting presentation information...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const valid = await queryFunction('getPresentation', holderAddress, hash);
      
      spinner.stop();
      
      console.log(chalk.green('Presentation information:'));
      console.log(chalk.blue('Valid:'), valid[0] ? 'Yes' : 'No');
    } catch (error) {
      spinner.fail(chalk.red('Failed to get presentation'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Verify presentation command
const verify = program
  .command('verify')
  .description('Verify a presentation')
  .argument('<holder>', 'Address or account ID of the holder')
  .argument('<hash>', 'Hash of the presentation')
  .action(async (holder, hash) => {
    const spinner = ora('Verifying presentation...').start();
    
    try {
      const holderAddress = getEvmAddress(holder);
      
      const isValid = await queryFunction('verifyPresentation', holderAddress, hash);
      
      spinner.stop();
      
      if (isValid[0]) {
        console.log(chalk.green('✓ Presentation is valid'));
      } else {
        console.log(chalk.yellow('✗ Presentation is not valid'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to verify presentation'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

module.exports = {
  create,
  get,
  verify
};
