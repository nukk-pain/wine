#!/usr/bin/env node
// scripts/test-runner.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive test runner for wine-tracker application
 * Supports different test suites and environments
 */

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const log = (message, color = COLORS.RESET) => {
  console.log(`${color}${message}${COLORS.RESET}`);
};

const logSection = (title) => {
  log(`\n${'='.repeat(60)}`, COLORS.BLUE);
  log(`${COLORS.BOLD}${title}${COLORS.RESET}`, COLORS.BLUE);
  log(`${'='.repeat(60)}`, COLORS.BLUE);
};

const runCommand = (command, description) => {
  log(`\n→ ${description}...`, COLORS.YELLOW);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    log(`✓ ${description} passed`, COLORS.GREEN);
    return { success: true, output };
  } catch (error) {
    log(`✗ ${description} failed`, COLORS.RED);
    log(error.stdout || error.message, COLORS.RED);
    return { success: false, error: error.message, output: error.stdout };
  }
};

const testSuites = {
  unit: {
    name: 'Unit Tests',
    command: 'npm test -- __tests__/unit/ --coverage --passWithNoTests',
    description: 'Running unit tests with coverage'
  },
  integration: {
    name: 'Integration Tests (Core)',
    command: 'npm test -- __tests__/integration/complete-workflow.test.ts __tests__/integration/end-to-end-workflow.test.ts --passWithNoTests',
    description: 'Running core integration tests'
  },
  performance: {
    name: 'Performance Tests',
    command: 'npm test -- __tests__/performance/ --passWithNoTests',
    description: 'Running performance and caching tests'
  },
  vision: {
    name: 'Vision API Tests',
    command: 'npm test -- __tests__/unit/vision-*.test.ts __tests__/performance/vision-*.test.ts --passWithNoTests',
    description: 'Running Vision API specific tests'
  },
  all: {
    name: 'All Tests',
    command: 'npm test -- --passWithNoTests --coverage',
    description: 'Running complete test suite'
  }
};

const validateEnvironment = () => {
  logSection('Environment Validation');
  
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      },
      message: 'Node.js 18+ required'
    },
    {
      name: 'Package.json exists',
      check: () => fs.existsSync(path.join(process.cwd(), 'package.json')),
      message: 'package.json not found'
    },
    {
      name: 'Node modules installed',
      check: () => fs.existsSync(path.join(process.cwd(), 'node_modules')),
      message: 'node_modules not found, run npm install'
    },
    {
      name: 'Test images exist',
      check: () => {
        const test1 = fs.existsSync(path.join(process.cwd(), 'test1.jpg'));
        const test2 = fs.existsSync(path.join(process.cwd(), 'test2.jpg'));
        return test1 && test2;
      },
      message: 'test1.jpg and test2.jpg required in project root'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check, message }) => {
    try {
      if (check()) {
        log(`✓ ${name}`, COLORS.GREEN);
      } else {
        log(`✗ ${name}: ${message}`, COLORS.RED);
        allPassed = false;
      }
    } catch (error) {
      log(`✗ ${name}: ${error.message}`, COLORS.RED);
      allPassed = false;
    }
  });
  
  if (!allPassed) {
    log('\nEnvironment validation failed. Please fix the issues above.', COLORS.RED);
    process.exit(1);
  }
  
  log('\n✓ Environment validation passed', COLORS.GREEN);
  return true;
};

const generateTestReport = (results) => {
  logSection('Test Report Summary');
  
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  
  log(`Total test suites: ${total}`);
  log(`Passed: ${passed}`, passed === total ? COLORS.GREEN : COLORS.YELLOW);
  if (failed > 0) {
    log(`Failed: ${failed}`, COLORS.RED);
  }
  
  // Detailed results
  log('\nDetailed Results:', COLORS.BOLD);
  results.forEach(({ suite, success, error }) => {
    const status = success ? '✓' : '✗';
    const color = success ? COLORS.GREEN : COLORS.RED;
    log(`  ${status} ${suite}`, color);
    if (!success && error) {
      log(`    Error: ${error}`, COLORS.RED);
    }
  });
  
  // Generate coverage report path if available
  const coverageDir = path.join(process.cwd(), 'coverage');
  if (fs.existsSync(coverageDir)) {
    log(`\nCoverage report available at: file://${path.join(coverageDir, 'lcov-report/index.html')}`, COLORS.BLUE);
  }
  
  return { total, passed, failed };
};

const main = async () => {
  const args = process.argv.slice(2);
  const suiteToRun = args[0] || 'all';
  const skipValidation = args.includes('--skip-validation');
  const continueOnFailure = args.includes('--continue-on-failure');
  
  log(`${COLORS.BOLD}Wine Tracker Test Runner${COLORS.RESET}`, COLORS.BLUE);
  log(`Suite: ${suiteToRun}`, COLORS.BLUE);
  
  // Environment validation
  if (!skipValidation) {
    validateEnvironment();
  }
  
  const results = [];
  
  if (suiteToRun === 'all') {
    // Run all test suites except 'all' to avoid recursion
    const suitesToRun = Object.keys(testSuites).filter(key => key !== 'all');
    
    for (const suiteName of suitesToRun) {
      const suite = testSuites[suiteName];
      logSection(suite.name);
      
      const result = runCommand(suite.command, suite.description);
      results.push({
        suite: suite.name,
        success: result.success,
        error: result.error
      });
      
      if (!result.success && !continueOnFailure) {
        log(`\nStopping due to failure in ${suite.name}`, COLORS.RED);
        break;
      }
    }
  } else if (testSuites[suiteToRun]) {
    // Run specific test suite
    const suite = testSuites[suiteToRun];
    logSection(suite.name);
    
    const result = runCommand(suite.command, suite.description);
    results.push({
      suite: suite.name,
      success: result.success,
      error: result.error
    });
  } else {
    log(`Unknown test suite: ${suiteToRun}`, COLORS.RED);
    log('Available suites:', COLORS.YELLOW);
    Object.keys(testSuites).forEach(suite => {
      log(`  - ${suite}: ${testSuites[suite].name}`, COLORS.YELLOW);
    });
    process.exit(1);
  }
  
  // Generate report
  const { passed, failed } = generateTestReport(results);
  
  // Exit with appropriate code
  if (failed > 0) {
    log(`\n${COLORS.RED}Some tests failed. Please check the output above.${COLORS.RESET}`);
    process.exit(1);
  } else {
    log(`\n${COLORS.GREEN}All tests passed successfully!${COLORS.RESET}`);
    process.exit(0);
  }
};

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    log(`\nUnexpected error: ${error.message}`, COLORS.RED);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runCommand, validateEnvironment, generateTestReport };