#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const didCommands = require('../lib/commands/did');
const credentialCommands = require('../lib/commands/credential');
const presentationCommands = require('../lib/commands/presentation');
const adminCommands = require('../lib/commands/admin');
const { initConfig } = require('../lib/utils/config');

// Initialize configuration
initConfig();

// Set up the program
program
  .name('did-cli')
  .description('CLI tool for DID Management on Hedera')
  .version('1.0.0');

// DID commands
program
  .command('did')
  .description('DID management commands')
  .addCommand(didCommands.create)
  .addCommand(didCommands.update)
  .addCommand(didCommands.get);

// Credential commands
program
  .command('credential')
  .description('Credential management commands')
  .addCommand(credentialCommands.issue)
  .addCommand(credentialCommands.revoke)
  .addCommand(credentialCommands.suspend)
  .addCommand(credentialCommands.unsuspend)
  .addCommand(credentialCommands.update)
  .addCommand(credentialCommands.get)
  .addCommand(credentialCommands.verify);

// Presentation commands
program
  .command('presentation')
  .description('Presentation management commands')
  .addCommand(presentationCommands.create)
  .addCommand(presentationCommands.get)
  .addCommand(presentationCommands.verify);

// Admin commands
program
  .command('admin')
  .description('Admin management commands')
  .addCommand(adminCommands.grantIssuer)
  .addCommand(adminCommands.revokeIssuer)
  .addCommand(adminCommands.pause)
  .addCommand(adminCommands.unpause);

// Config command
program
  .command('config')
  .description('Configure CLI settings')
  .option('-n, --network <network>', 'Set network (mainnet/testnet/previewnet)')
  .option('-a, --account-id <accountId>', 'Set Hedera account ID')
  .option('-p, --private-key <privateKey>', 'Set private key (use with caution)')
  .option('-c, --contract <address>', 'Set contract ID (0.0.x format) or EVM address')
  .option('-m, --mirror-node <url>', 'Set mirror node URL')
  .action((options) => {
    require('../lib/commands/config').configure(options);
  });

program.parse(process.argv);

// If no args, show help
if (process.argv.length <= 2) {
  program.help();
}
