const chalk = require('chalk');
const { 
  setConfig, 
  getConfig, 
  setPrivateKey, 
  setNetwork, 
  setAccountId, 
  setContractId 
} = require('../utils/config');
const { resetClient } = require('../utils/hedera');

async function configure(options) {
  try {
    let configChanged = false;
    
    if (options.network) {
      setNetwork(options.network);
      console.log(chalk.green(`Network set to: ${options.network}`));
      resetClient();
      configChanged = true;
    }
    
    if (options.accountId) {
      setAccountId(options.accountId);
      console.log(chalk.green(`Hedera account ID set to: ${options.accountId}`));
      resetClient();
      configChanged = true;
    }
    
    if (options.privateKey) {
      setPrivateKey(options.privateKey);
      console.log(chalk.green('Private key has been set.'));
      resetClient();
      configChanged = true;
    }
    
    if (options.contract) {
      setContractId(options.contract);
      console.log(chalk.green(`Contract ID set to: ${options.contract}`));
      configChanged = true;
    }
    
    if (options.mirrorNode) {
      setConfig('network.mirrorNode', options.mirrorNode);
      console.log(chalk.green(`Mirror node URL set to: ${options.mirrorNode}`));
      configChanged = true;
    }
    
    if (!configChanged) {
      // Display current config
      const config = getConfig().store;
      console.log(chalk.blue('Current configuration:'));
      console.log(chalk.blue('Network:'), config.network.name);
      console.log(chalk.blue('Mirror node:'), config.network.mirrorNode);
      console.log(chalk.blue('Hedera account ID:'), config.hedera.accountId || 'Not set');
      console.log(chalk.blue('Private key configured:'), config.hedera.privateKey ? 'Yes' : 'No');
      
      if (config.contract.id) {
        console.log(chalk.blue('Contract ID:'), config.contract.id);
      }
      
      if (config.contract.address) {
        console.log(chalk.blue('Contract address:'), config.contract.address);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error configuring CLI:'), error.message);
  }
}

module.exports = {
  configure
};
