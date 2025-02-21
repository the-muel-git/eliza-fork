#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
const envConfig = dotenv.parse(fs.readFileSync('.env'));

// Check for deprecated keys
const DEPRECATED_KEYS = ['SUPABASE_SERVICE_KEY'];
const REQUIRED_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'DISCORD_APPLICATION_ID',
  'DISCORD_API_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY'
];

console.log('Environment Configuration Check\n');

// Check .env file
console.log('Checking .env file:');
DEPRECATED_KEYS.forEach(key => {
  if (envConfig[key]) {
    console.log(`⚠️  WARNING: Deprecated key "${key}" found in .env file`);
  }
});

REQUIRED_KEYS.forEach(key => {
  if (!envConfig[key]) {
    console.log(`❌ Missing required key "${key}" in .env file`);
  } else {
    console.log(`✅ Found ${key}`);
  }
});

// Check process environment
console.log('\nChecking process environment:');
DEPRECATED_KEYS.forEach(key => {
  if (process.env[key]) {
    console.log(`⚠️  WARNING: Deprecated key "${key}" found in process environment`);
  }
});

// Check render.yaml
const renderPath = path.join(process.cwd(), 'render.yaml');
if (fs.existsSync(renderPath)) {
  console.log('\nChecking render.yaml:');
  const render = require('yaml').parse(fs.readFileSync(renderPath, 'utf8'));
  const envVars = render.services[0].envVars;
  
  // Check for character file configuration
  const characterFileConfig = envVars.find(v => v.key === 'CHARACTER_FILE');
  if (!characterFileConfig) {
    console.log('❌ Missing CHARACTER_FILE configuration in render.yaml');
  } else {
    const characterPath = characterFileConfig.value;
    console.log(`✅ Found CHARACTER_FILE configuration: ${characterPath}`);
    
    // Verify character file exists
    if (fs.existsSync(characterPath)) {
      console.log('✅ Character file exists at specified path');
    } else {
      console.log('❌ Character file not found at specified path');
    }
  }
  
  DEPRECATED_KEYS.forEach(key => {
    if (envVars.find(v => v.key === key)) {
      console.log(`⚠️  WARNING: Deprecated key "${key}" found in render.yaml`);
    }
  });

  REQUIRED_KEYS.forEach(key => {
    const found = envVars.find(v => v.key === key);
    if (!found) {
      console.log(`❌ Missing required key "${key}" in render.yaml`);
    } else {
      console.log(`✅ Found ${key} configuration`);
      if (found.sync === undefined) {
        console.log(`⚠️  WARNING: "${key}" should have sync: false for security`);
      }
    }
  });
} 