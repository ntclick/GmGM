#!/usr/bin/env node

import fetch from 'node-fetch';

async function checkCompilerVersions() {
    try {
        console.log('🔍 Checking supported compiler versions...');
        
        const response = await fetch('https://api-sepolia.etherscan.io/api?module=contract&action=compilerversion&apikey=SMYU9ZMV9DB55ZAFPW5JKN56S52RVBIWX6');
        const data = await response.json();
        
        if (data.status === '1') {
            console.log('✅ Supported compiler versions:');
            console.log(JSON.stringify(data.result, null, 2));
        } else {
            console.error('❌ Error:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Error checking compiler versions:', error.message);
    }
}

checkCompilerVersions(); 