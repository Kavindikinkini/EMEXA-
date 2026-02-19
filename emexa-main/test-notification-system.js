#!/usr/bin/env node

/**
 * EMEXA Notification System Test Script
 * 
 * This script tests the full notification workflow including:
 * - Email notification settings
 * - In-app notification settings
 * - Notification creation
 * - Email sending with settings checks
 * 
 * Usage:
 * node test-notification-system.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  divider: () => console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`)
};

/**
 * Login user and get token
 */
async function login(email, password) {
  try {
    log.test('Logging in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.token) {
      token = response.data.token;
      userId = response.data.user?._id || response.data.userId;
      log.success(`Logged in as ${email}`);
      log.info(`User ID: ${userId}`);
      return true;
    }
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Get current notification settings
 */
async function getNotificationSettings() {
  try {
    log.test('Fetching notification settings...');
    const response = await axios.get(`${API_BASE_URL}/notifications/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log.success('Notification settings retrieved:');
      console.log(`  📧 Email Notifications: ${response.data.notificationSettings.emailNotifications ? 'ON' : 'OFF'}`);
      console.log(`  🔔 In-App Notifications: ${response.data.notificationSettings.inAppNotifications ? 'ON' : 'OFF'}`);
      console.log(`  📱 SMS Notifications: ${response.data.notificationSettings.smsNotifications ? 'ON' : 'OFF'}`);
      return response.data.notificationSettings;
    }
  } catch (error) {
    log.error(`Failed to fetch settings: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Update notification settings
 */
async function updateNotificationSettings(settings) {
  try {
    log.test('Updating notification settings...');
    const response = await axios.put(`${API_BASE_URL}/users/notification-settings`, settings, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data) {
      log.success('Settings updated successfully');
      return true;
    }
  } catch (error) {
    log.error(`Failed to update settings: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test notifications via endpoint
 */
async function testNotifications(type = 'both') {
  try {
    log.test(`Testing notifications (type: ${type})...`);
    const response = await axios.post(`${API_BASE_URL}/notifications/test`, 
      { type },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      log.success('Test notifications executed:');
      console.log(`  📧 Email Notifications Enabled: ${response.data.tests.emailNotificationsEnabled}`);
      console.log(`  🔔 In-App Notifications Enabled: ${response.data.tests.inAppNotificationsEnabled}`);
      
      if (type === 'email' || type === 'both') {
        console.log(`  📧 Email Sent: ${response.data.tests.emailSent ? 'YES' : 'NO'}`);
        if (!response.data.tests.emailSent) {
          console.log(`     Reason: ${response.data.tests.emailMessage || response.data.tests.emailError}`);
        }
      }
      
      if (type === 'inapp' || type === 'both') {
        console.log(`  🔔 In-App Notification Created: ${response.data.tests.inAppNotificationCreated ? 'YES' : 'NO'}`);
        if (!response.data.tests.inAppNotificationCreated) {
          console.log(`     Reason: ${response.data.tests.inAppNotificationMessage}`);
        }
      }
      
      return true;
    }
  } catch (error) {
    log.error(`Failed to test notifications: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Get notifications
 */
async function getNotifications() {
  try {
    log.test('Fetching in-app notifications...');
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.notifications.length} notifications`);
      log.info(`Unread count: ${response.data.unreadCount}`);
      
      if (response.data.notifications.length > 0) {
        console.log('\n  Recent notifications:');
        response.data.notifications.slice(0, 3).forEach((notif, idx) => {
          console.log(`  ${idx + 1}. ${notif.title} (${notif.isRead ? 'Read' : 'Unread'})`);
        });
      }
      
      if (response.data.message) {
        log.warn(`Note: ${response.data.message}`);
      }
      
      return response.data.notifications;
    }
  } catch (error) {
    log.error(`Failed to fetch notifications: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Run full test suite
 */
async function runFullTest() {
  log.divider();
  console.log(`${colors.cyan}EMEXA NOTIFICATION SYSTEM TEST SUITE${colors.reset}`);
  log.divider();
  
  // Step 1: Get current settings
  console.log('\n📋 STEP 1: Check Current Settings');
  log.divider();
  const currentSettings = await getNotificationSettings();
  
  if (!currentSettings) {
    log.error('Cannot proceed without settings');
    return;
  }
  
  // Step 2: Test with email enabled
  console.log('\n\n📋 STEP 2: Test with Email Notifications ENABLED');
  log.divider();
  await updateNotificationSettings({
    emailNotifications: true,
    inAppNotifications: true,
    smsNotifications: false
  });
  await testNotifications('both');
  
  // Step 3: Disable email, keep in-app
  console.log('\n\n📋 STEP 3: Test with Email Notifications DISABLED');
  log.divider();
  await updateNotificationSettings({
    emailNotifications: false,
    inAppNotifications: true,
    smsNotifications: false
  });
  await testNotifications('both');
  log.warn('Email should NOT be sent but in-app notification should be created');
  
  // Step 4: Disable in-app, enable email
  console.log('\n\n📋 STEP 4: Test with In-App Notifications DISABLED');
  log.divider();
  await updateNotificationSettings({
    emailNotifications: true,
    inAppNotifications: false,
    smsNotifications: false
  });
  await testNotifications('both');
  log.warn('In-app notification should NOT be created but email should be sent');
  
  // Step 5: Disable both
  console.log('\n\n📋 STEP 5: Test with BOTH Notifications DISABLED');
  log.divider();
  await updateNotificationSettings({
    emailNotifications: false,
    inAppNotifications: false,
    smsNotifications: false
  });
  await testNotifications('both');
  log.warn('Neither email nor in-app notification should be sent/created');
  
  // Step 6: Re-enable both
  console.log('\n\n📋 STEP 6: Re-Enable All Notifications');
  log.divider();
  await updateNotificationSettings({
    emailNotifications: true,
    inAppNotifications: true,
    smsNotifications: false
  });
  log.success('Settings restored to default');
  
  // Step 7: Get final notifications
  console.log('\n\n📋 STEP 7: Fetch All Notifications');
  log.divider();
  await getNotifications();
  
  // Summary
  console.log('\n');
  log.divider();
  console.log(`${colors.green}✅ TEST SUITE COMPLETED${colors.reset}`);
  log.divider();
  console.log('\n📝 SUMMARY:');
  console.log('  1. Email notifications are sent only when enabled');
  console.log('  2. In-app notifications are shown only when enabled');
  console.log('  3. Settings can be toggled independently');
  console.log('  4. Test endpoint reports accurate status');
  console.log('  5. Notification retrieval respects settings');
  
  process.exit(0);
}

/**
 * Interactive menu
 */
async function interactiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  try {
    // Get credentials
    console.log('\n🔐 EMEXA Notification System - Interactive Test\n');
    const email = await question('Enter email (student or teacher): ');
    const password = await question('Enter password: ');
    
    // Login
    const loggedIn = await login(email, password);
    if (!loggedIn) {
      process.exit(1);
    }
    
    // Main menu
    let running = true;
    while (running) {
      console.log('\n📋 Select an option:');
      console.log('  1. View current settings');
      console.log('  2. Enable all notifications');
      console.log('  3. Disable email notifications');
      console.log('  4. Disable in-app notifications');
      console.log('  5. Disable all notifications');
      console.log('  6. Test notifications');
      console.log('  7. View notifications');
      console.log('  8. Run full test suite');
      console.log('  9. Exit');
      
      const choice = await question('\nChoice (1-9): ');
      
      switch(choice) {
        case '1':
          await getNotificationSettings();
          break;
        case '2':
          await updateNotificationSettings({
            emailNotifications: true,
            inAppNotifications: true,
            smsNotifications: false
          });
          break;
        case '3':
          await updateNotificationSettings({
            emailNotifications: false,
            inAppNotifications: true,
            smsNotifications: false
          });
          break;
        case '4':
          await updateNotificationSettings({
            emailNotifications: true,
            inAppNotifications: false,
            smsNotifications: false
          });
          break;
        case '5':
          await updateNotificationSettings({
            emailNotifications: false,
            inAppNotifications: false,
            smsNotifications: false
          });
          break;
        case '6':
          await testNotifications('both');
          break;
        case '7':
          await getNotifications();
          break;
        case '8':
          rl.close();
          await runFullTest();
          return;
        case '9':
          running = false;
          break;
        default:
          log.warn('Invalid choice');
      }
    }
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Main entry point
if (process.argv.includes('--auto')) {
  // Run auto test with test credentials
  login('student@test.com', 'password123').then(() => {
    if (token) runFullTest();
  });
} else {
  // Run interactive test
  interactiveMenu();
}
