const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { executeFunction } = require('../utils/contracts');
const { AccountId } = require('@hashgraph/sdk');

// Convert Hedera account ID to EVM address if needed
function getEvmAddress(address) {
  if (address.includes('.')) {
    const accountId = AccountId.fromString(address);
    return accountId.toSolidityAddress();
  }
  return address.startsWith('0x') ? address : `0x${address}`;
}

// Grant issuer role command
const grantIssuer = program
  .command('grant-issuer')
  .description('Grant issuer role to an address')
  .argument('<address>', 'Address or account ID to grant issuer role to')
  .action(async (address) => {
    const spinner = ora('Granting issuer role...').start();
    
    try {
      const accountAddress = getEvmAddress(address);
      
      const result = await executeFunction('grantIssuerRole', accountAddress);
      
      spinner.succeed(chalk.green('Issuer role granted successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to grant issuer role'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Revoke issuer role command
const revokeIssuer = program
  .command('revoke-issuer')
  .description('Revoke issuer role from an address')
  .argument('<address>', 'Address or account ID to revoke issuer role from')
  .action(async (address) => {
    const spinner = ora('Revoking issuer role...').start();
    
    try {
      const accountAddress = getEvmAddress(address);
      
      const result = await executeFunction('revokeIssuerRole', accountAddress);
      
      spinner.succeed(chalk.green('Issuer role revoked successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to revoke issuer role'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Pause contract command
const pause = program
  .command('pause')
  .description('Pause the contract (admin only)')
  .action(async () => {
    const spinner = ora('Pausing contract...').start();
    
    try {
      const result = await executeFunction('pause');
      
      spinner.succeed(chalk.green('Contract paused successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to pause contract'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Unpause contract command
const unpause = program
  .command('unpause')
  .description('Unpause the contract (admin only)')
  .action(async () => {
    const spinner = ora('Unpausing contract...').start();
    
    try {
      const result = await executeFunction('unpause');
      
      spinner.succeed(chalk.green('Contract unpaused successfully!'));
      console.log(chalk.blue('Transaction ID:'), result.transactionId);
      console.log(chalk.blue('Status:'), result.status);
    } catch (error) {
      spinner.fail(chalk.red('Failed to unpause contract'));
      console.error(chalk.red('Error:'), error.message);
    }
  });

module.exports = {
  grantIssuer,
  revokeIssuer,
  pause,
  unpause
};
