#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}

class ProjectDiagnostic {
  private excludedDirs = new Set([
    'node_modules', 'dist', 'build', 'coverage', '.git', 'tmp', 'uploads',
    '.next', '.nuxt', '.vscode', '.idea', '__pycache__', '.pytest_cache'
  ]);

  private output: string[] = [];

  constructor() {
    this.output.push('# Project Diagnostic Report');
    this.output.push('');
    this.output.push(`Generated: ${new Date().toISOString()}`);
    this.output.push('');
  }

  private shouldExclude(name: string): boolean {
    return this.excludedDirs.has(name) || name.startsWith('.');
  }

  private getFileTree(dir: string, prefix: string = '', maxDepth: number = 4, currentDepth: number = 0): string[] {
    if (currentDepth >= maxDepth) return [];
    
    const tree: string[] = [];
    
    try {
      const items = fs.readdirSync(dir)
        .filter(name => !this.shouldExclude(name))
        .map(name => ({
          name,
          path: path.join(dir, name),
          isDirectory: fs.statSync(path.join(dir, name)).isDirectory()
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

      items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        
        tree.push(`${prefix}${connector}${item.name}`);
        
        if (item.isDirectory) {
          tree.push(...this.getFileTree(item.path, newPrefix, maxDepth, currentDepth + 1));
        }
      });
    } catch (error) {
      tree.push(`${prefix}[Error reading directory: ${error}]`);
    }
    
    return tree;
  }

  private readFile(filePath: string, maxLines?: number): string | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      if (maxLines) {
        const lines = content.split('\n');
        if (lines.length > maxLines) {
          return lines.slice(0, maxLines).join('\n') + `\n\n... (truncated at ${maxLines} lines, total: ${lines.length} lines)`;
        }
      }
      return content;
    } catch (error) {
      return `[Error reading file: ${error}]`;
    }
  }

  private addSection(title: string, content: string) {
    this.output.push(`## ${title}`);
    this.output.push('');
    this.output.push(content);
    this.output.push('');
  }

  private addCodeSection(title: string, content: string | null, language: string = '') {
    this.output.push(`## ${title}`);
    this.output.push('');
    if (content === null) {
      this.output.push('*File not found*');
    } else {
      this.output.push(`\`\`\`${language}`);
      this.output.push(content);
      this.output.push('```');
    }
    this.output.push('');
  }

  private findFiles(pattern: string, dir: string = '.'): string[] {
    const results: string[] = [];
    
    const search = (currentDir: string) => {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          if (this.shouldExclude(item)) continue;
          
          const itemPath = path.join(currentDir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            search(itemPath);
          } else if (item.match(new RegExp(pattern))) {
            results.push(itemPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    search(dir);
    return results;
  }

  public generateReport(): string {
    // 1. Repository Structure
    this.addSection('Repository Structure', '```\n' + this.getFileTree('.').join('\n') + '\n```');

    // 2. Configuration Files
    const configFiles = [
      { path: 'package.json', lang: 'json' },
      { path: 'replit.md', lang: 'markdown' },
      { path: '.env.example', lang: 'bash' },
      { path: 'tsconfig.json', lang: 'json' },
      { path: 'vite.config.ts', lang: 'typescript' },
      { path: 'vite.config.js', lang: 'javascript' },
      { path: 'drizzle.config.ts', lang: 'typescript' },
      { path: 'prisma/schema.prisma', lang: 'prisma' }
    ];

    configFiles.forEach(({ path: filePath, lang }) => {
      const content = this.readFile(filePath);
      if (content !== null) {
        this.addCodeSection(`Configuration: ${filePath}`, content, lang);
      }
    });

    // 3. Schema Files
    const schemaContent = this.readFile('shared/schema.ts');
    this.addCodeSection('Database Schema: shared/schema.ts', schemaContent, 'typescript');

    // Find additional Prisma schemas
    const prismaSchemas = this.findFiles('schema\\.prisma$');
    prismaSchemas.forEach(schemaPath => {
      if (!schemaPath.includes('prisma/schema.prisma')) {
        const content = this.readFile(schemaPath);
        this.addCodeSection(`Prisma Schema: ${schemaPath}`, content, 'prisma');
      }
    });

    // 4. Server Files
    const serverIndex = this.readFile('server/index.ts') || this.readFile('server/index.js');
    this.addCodeSection('Server Entry: server/index.*', serverIndex, 'typescript');

    // List server routes and services
    const routeFiles = this.findFiles('.*\\.(ts|js)$', 'server/routes');
    const serviceFiles = this.findFiles('.*\\.(ts|js)$', 'server/services');

    if (routeFiles.length > 0) {
      this.output.push('## Server Routes');
      this.output.push('');
      routeFiles.forEach(routeFile => {
        const content = this.readFile(routeFile, 60);
        this.addCodeSection(`Route: ${routeFile}`, content, 'typescript');
      });
    }

    if (serviceFiles.length > 0) {
      this.output.push('## Server Services');
      this.output.push('');
      serviceFiles.forEach(serviceFile => {
        const content = this.readFile(serviceFile, 60);
        this.addCodeSection(`Service: ${serviceFile}`, content, 'typescript');
      });
    }

    // 5. Client Files
    const clientApp = this.readFile('client/src/App.tsx') || this.readFile('src/App.tsx');
    this.addCodeSection('Client App: App.tsx', clientApp, 'typescript');

    // Client pages
    const pageFiles = this.findFiles('.*\\.(tsx|ts|jsx|js)$', 'client/src/pages') || 
                     this.findFiles('.*\\.(tsx|ts|jsx|js)$', 'src/pages');
    
    if (pageFiles.length > 0) {
      this.output.push('## Client Pages');
      this.output.push('');
      pageFiles.forEach(pageFile => {
        const content = this.readFile(pageFile, 120);
        this.addCodeSection(`Page: ${pageFile}`, content, 'typescript');
      });
    }

    // I18n files
    const i18nProvider = this.readFile('client/src/contexts/I18nProvider.tsx') || 
                        this.readFile('src/contexts/I18nProvider.tsx');
    this.addCodeSection('I18n Provider: I18nProvider.tsx', i18nProvider, 'typescript');

    const i18nConfig = this.readFile('client/src/i18n.ts') || this.readFile('src/i18n.ts');
    this.addCodeSection('I18n Config: i18n.ts', i18nConfig, 'typescript');

    // 6. Analysis
    this.generateAnalysis();

    return this.output.join('\n');
  }

  private generateAnalysis() {
    this.output.push('## Analysis');
    this.output.push('');

    // Find duplicate components
    const componentPatterns = [
      { name: 'Sidebars', pattern: 'sidebar|Sidebar' },
      { name: 'Headers', pattern: 'header|Header' },
      { name: 'Navigation', pattern: 'nav|Nav|navigation' },
      { name: 'I18n Configs', pattern: 'i18n|I18n|internationalization' }
    ];

    componentPatterns.forEach(({ name, pattern }) => {
      const files = this.findFiles(`.*${pattern}.*\\.(tsx|ts|jsx|js)$`);
      if (files.length > 1) {
        this.output.push(`### Potential Duplicate ${name}`);
        this.output.push('');
        files.forEach(file => this.output.push(`- ${file}`));
        this.output.push('');
      }
    });

    // Find mock/test data references
    const mockPatterns = ['mock', 'test', 'fixture', 'dummy', 'placeholder'];
    const filesWithMockData: string[] = [];

    const searchForMockData = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          if (this.shouldExclude(item)) continue;
          
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            searchForMockData(itemPath);
          } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
            const content = this.readFile(itemPath);
            if (content) {
              const lowerContent = content.toLowerCase();
              if (mockPatterns.some(pattern => lowerContent.includes(pattern))) {
                filesWithMockData.push(itemPath);
              }
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    searchForMockData('.');

    if (filesWithMockData.length > 0) {
      this.output.push('### Files with Potential Mock/Test Data References');
      this.output.push('');
      filesWithMockData.forEach(file => this.output.push(`- ${file}`));
      this.output.push('');
    }

    // File counts
    const jsFiles = this.findFiles('.*\\.(ts|tsx|js|jsx)$');
    const componentFiles = this.findFiles('.*\\.(tsx|jsx)$');
    
    this.output.push('### Project Statistics');
    this.output.push('');
    this.output.push(`- Total JavaScript/TypeScript files: ${jsFiles.length}`);
    this.output.push(`- React component files: ${componentFiles.length}`);
    this.output.push('');
  }
}

// Generate and save report
const diagnostic = new ProjectDiagnostic();
const report = diagnostic.generateReport();

// Write to DIAGNOSTIC.md
const outputPath = path.join(process.cwd(), 'DIAGNOSTIC.md');
fs.writeFileSync(outputPath, report, 'utf-8');

console.log('Diagnostic report generated successfully!');
console.log(`Report saved to: ${outputPath}`);
console.log('');
console.log('--- REPORT CONTENT ---');
console.log(report);