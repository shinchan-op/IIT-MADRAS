const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const { getContractAddress } = require('./config');
const { executeContract, queryContract, createContractParams } = require('./hedera');

// Load contract ABI
const abiPath = path.join(__dirname, '../../contracts/DidManage.json');
let contractAbi;

try {
  contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
} catch (error) {
  console.error('Error loading contract ABI:', error.message);
  contractAbi = [];
}

// Interface for encoding/decoding function data
const contractInterface = new ethers.utils.Interface(contractAbi);

// Calculate keccak256 hash for various data
function calculateHash(data) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(data)));
}

// Execute a contract function
async function executeFunction(functionName, ...args) {
  try {
    // Encode function data using ethers
    const functionData = contractInterface.encodeFunctionData(functionName, args);
    
    // Execute on Hedera
    const result = await executeContract(functionName, args);
    return result;
  } catch (error) {
    throw new Error(`Failed to execute ${functionName}: ${error.message}`);
  }
}

// Query a contract function
async function queryFunction(functionName, ...args) {
  try {
    // Query on Hedera
    const result = await queryContract(functionName, args);
    
    // Decode the result
    const decodedResult = contractInterface.decodeFunctionResult(functionName, result.bytes);
    return decodedResult;
  } catch (error) {
    throw new Error(`Failed to query ${functionName}: ${error.message}`);
  }
}

module.exports = {
  calculateHash,
  executeFunction,
  queryFunction,
  contractInterface
};
