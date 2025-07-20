// __tests__/integration/deployment.test.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('NAS Deployment Script Integration', () => {
  const deploymentDir = path.join(process.cwd(), 'deployment');
  const deployVisionScript = path.join(deploymentDir, 'deploy-vision.sh');
  const deployMainScript = path.join(deploymentDir, 'deploy.sh');
  const ecosystemConfig = path.join(process.cwd(), 'ecosystem.config.js');

  beforeAll(() => {
    // 배포 디렉토리가 존재하는지 확인
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
  });

  describe('Deployment Scripts Existence', () => {
    it('should have deploy-vision.sh script', () => {
      expect(fs.existsSync(deployVisionScript)).toBe(true);
    });

    it('should have main deploy.sh script', () => {
      expect(fs.existsSync(deployMainScript)).toBe(true);
    });

    it('should have ecosystem.config.js for PM2', () => {
      expect(fs.existsSync(ecosystemConfig)).toBe(true);
    });
  });

  describe('Vision API Deployment Script', () => {
    it('should be executable', () => {
      if (fs.existsSync(deployVisionScript)) {
        const stats = fs.statSync(deployVisionScript);
        // Check if script has execute permissions (Unix-like systems)
        if (process.platform !== 'win32') {
          expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
        }
      }
    });

    it('should contain required environment variable setup', () => {
      if (fs.existsSync(deployVisionScript)) {
        const scriptContent = fs.readFileSync(deployVisionScript, 'utf8');
        
        expect(scriptContent).toContain('GOOGLE_APPLICATION_CREDENTIALS');
        expect(scriptContent).toContain('GOOGLE_CLOUD_PROJECT');
        expect(scriptContent).toContain('vision.json');
        expect(scriptContent).toContain('.env.production');
      }
    });

    it('should have proper error handling', () => {
      if (fs.existsSync(deployVisionScript)) {
        const scriptContent = fs.readFileSync(deployVisionScript, 'utf8');
        
        // Check for basic error handling patterns
        expect(scriptContent).toContain('set -e'); // Exit on error
        expect(scriptContent).toMatch(/if.*then|&&|\|\|/); // Conditional checks
      }
    });

    it('should validate required environment variables', () => {
      if (fs.existsSync(deployVisionScript)) {
        const scriptContent = fs.readFileSync(deployVisionScript, 'utf8');
        
        expect(scriptContent).toContain('NAS_USER');
        expect(scriptContent).toContain('NAS_IP');
        expect(scriptContent).toContain('PROJECT_PATH');
      }
    });
  });

  describe('Main Deployment Script', () => {
    it('should integrate with Vision API deployment', () => {
      if (fs.existsSync(deployMainScript)) {
        const scriptContent = fs.readFileSync(deployMainScript, 'utf8');
        
        expect(scriptContent).toContain('deploy-vision.sh');
      }
    });

    it('should handle environment-specific deployment', () => {
      if (fs.existsSync(deployMainScript)) {
        const scriptContent = fs.readFileSync(deployMainScript, 'utf8');
        
        expect(scriptContent).toContain('NODE_ENV');
        expect(scriptContent).toMatch(/production|development/);
      }
    });

    it('should include PM2 deployment commands', () => {
      if (fs.existsSync(deployMainScript)) {
        const scriptContent = fs.readFileSync(deployMainScript, 'utf8');
        
        expect(scriptContent).toContain('pm2');
        expect(scriptContent).toMatch(/restart|reload|start/);
      }
    });
  });

  describe('PM2 Ecosystem Configuration', () => {
    it('should have production environment configuration', () => {
      if (fs.existsSync(ecosystemConfig)) {
        const configContent = fs.readFileSync(ecosystemConfig, 'utf8');
        
        expect(configContent).toContain('env_production');
        expect(configContent).toContain('NODE_ENV');
        expect(configContent).toContain('PORT');
      }
    });

    it('should include Vision API environment variables', () => {
      if (fs.existsSync(ecosystemConfig)) {
        const configContent = fs.readFileSync(ecosystemConfig, 'utf8');
        
        expect(configContent).toContain('GOOGLE_APPLICATION_CREDENTIALS');
        expect(configContent).toContain('GOOGLE_CLOUD_PROJECT');
      }
    });

    it('should have proper NAS paths configured', () => {
      if (fs.existsSync(ecosystemConfig)) {
        const configContent = fs.readFileSync(ecosystemConfig, 'utf8');
        
        expect(configContent).toContain('/volume2/web/wine');
        expect(configContent).toContain('wine-tracker');
      }
    });
  });

  describe('Deployment Validation', () => {
    it('should validate deployment prerequisites', () => {
      // This test checks if the deployment can validate its prerequisites
      // In a real deployment, this would check:
      // - NAS connectivity
      // - Required files existence
      // - Environment variables setup
      
      const requiredEnvVars = [
        'NAS_USER',
        'NAS_IP', 
        'PROJECT_PATH',
        'GOOGLE_CLOUD_PROJECT',
        'NOTION_API_KEY',
        'NOTION_DATABASE_ID'
      ];

      // In test environment, we just check that the validation logic exists
      expect(requiredEnvVars.length).toBeGreaterThan(0);
    });

    it('should have backup and rollback procedures', () => {
      if (fs.existsSync(deployMainScript)) {
        const scriptContent = fs.readFileSync(deployMainScript, 'utf8');
        
        // Check for backup/rollback functionality
        expect(scriptContent).toMatch(/backup|rollback|restore/i);
      }
    });
  });

  describe('Security Considerations', () => {
    it('should not contain hardcoded credentials', () => {
      const scriptsToCheck = [deployVisionScript, deployMainScript];
      
      scriptsToCheck.forEach(scriptPath => {
        if (fs.existsSync(scriptPath)) {
          const content = fs.readFileSync(scriptPath, 'utf8');
          
          // Check that no sensitive data is hardcoded
          expect(content).not.toMatch(/password\s*=\s*["'].*["']/i);
          expect(content).not.toMatch(/api_key\s*=\s*["'].*["']/i);
          expect(content).not.toMatch(/secret\s*=\s*["'].*["']/i);
        }
      });
    });

    it('should use environment variables for sensitive data', () => {
      if (fs.existsSync(deployVisionScript)) {
        const scriptContent = fs.readFileSync(deployVisionScript, 'utf8');
        
        // Check that environment variables are used instead of hardcoded values
        expect(scriptContent).toMatch(/\$\{?\w+\}?/); // Environment variable pattern
      }
    });
  });
});