#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');
const sass = require('sass');

// Configuration
const config = {
  version: '0.2',
  buildDir: 'builds',
  srcDir: 'src',
  extensionName: 'tabs-combiner'
};

// Parse command line arguments
const args = process.argv.slice(2);
const cleanBeforeBuild = args.includes('--clean');
const watchMode = args.includes('--watch');
const prodMode = args.includes('--prod') || args.includes('prod');

// Normalize version to always have 3 parts (major.minor.patch)
function normalizeVersion(version) {
  const parts = version.split('.').map(Number);
  // Ensure we always have 3 parts (major, minor, patch)
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.join('.');
}

// Get version from manifest or use config
function getVersion() {
  try {
    const manifestPath = path.join(config.srcDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const normalizedVersion = normalizeVersion(manifest.version);
    return normalizedVersion.replace(/\./g, '_');
  } catch (error) {
    console.warn('Could not read version from manifest.json, using default');
    const normalizedVersion = normalizeVersion(config.version);
    return normalizedVersion.replace(/\./g, '_');
  }
}

// Obfuscate JavaScript file
function obfuscateJS(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(content, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    });
    
    fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode(), 'utf8');
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not obfuscate ${filePath}: ${error.message}`);
    return false;
  }
}

// Obfuscate CSS by shuffling properties within rules
function obfuscateCSS(css) {
  // CSS is already minified by CleanCSS, add property shuffling for obfuscation
  
  // Handle nested rules (@media, @keyframes, etc.) by processing level by level
  let result = '';
  let i = 0;
  
  while (i < css.length) {
    // Find the start of a rule
    const ruleStart = css.indexOf('{', i);
    if (ruleStart === -1) {
      result += css.substring(i);
      break;
    }
    
    // Extract selector
    result += css.substring(i, ruleStart + 1);
    
    // Find matching closing brace (handle nested rules)
    let depth = 1;
    let j = ruleStart + 1;
    let content = '';
    
    while (j < css.length && depth > 0) {
      const char = css[j];
      if (char === '{') depth++;
      else if (char === '}') depth--;
      
      if (depth > 0) {
        content += char;
      }
      j++;
    }
    
    // Process properties within this rule
    const props = content.split(';').filter(p => p.trim());
    if (props.length > 1) {
      // Shuffle properties using Fisher-Yates algorithm
      for (let k = props.length - 1; k > 0; k--) {
        const l = Math.floor(Math.random() * (k + 1));
        [props[k], props[l]] = [props[l], props[k]];
      }
      result += props.join(';');
    } else {
      result += content;
    }
    
    result += '}';
    i = j;
  }
  
  return result;
}

// Minify and obfuscate CSS file
function minifyCSS(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // First minify with CleanCSS
    const result = new CleanCSS({
      level: 2,
      compatibility: '*',
      format: false
    }).minify(content);
    
    if (result.errors.length > 0) {
      console.warn(`⚠️  CSS minification errors in ${filePath}:`, result.errors);
    }
    
    let obfuscatedCSS = result.styles;
    
    // Apply additional obfuscation
    obfuscatedCSS = obfuscateCSS(obfuscatedCSS);
    
    fs.writeFileSync(filePath, obfuscatedCSS, 'utf8');
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not minify/obfuscate ${filePath}: ${error.message}`);
    return false;
  }
}

// Compile SCSS file to CSS
function compileSCSS(scssPath) {
  try {
    const content = fs.readFileSync(scssPath, 'utf8');
    const result = sass.compileString(content, {
      style: 'expanded', // We'll minify later in prod mode
      loadPaths: [path.dirname(scssPath)]
    });
    
    // Create CSS file path (replace .scss with .css)
    const cssPath = scssPath.replace(/\.scss$/, '.css');
    fs.writeFileSync(cssPath, result.css, 'utf8');
    
    // Remove original SCSS file
    fs.unlinkSync(scssPath);
    
    return cssPath;
  } catch (error) {
    console.error(`❌ Error compiling SCSS ${scssPath}:`, error.message);
    return null;
  }
}

// Compile all SCSS files in directory
function compileSCSSFiles(dir, baseDir = null) {
  if (!baseDir) baseDir = dir;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      compileSCSSFiles(filePath, baseDir);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.scss' || ext === '.sass') {
        const relativePath = path.relative(baseDir, filePath);
        console.log(`   📦 Compiling SCSS: ${relativePath}`);
        compileSCSS(filePath);
      }
    }
  }
}

// Process files in directory (obfuscate JS, minify CSS)
function processFiles(dir, baseDir = null) {
  if (!baseDir) baseDir = dir;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processFiles(filePath, baseDir);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.js') {
        const relativePath = path.relative(baseDir, filePath);
        console.log(`   🔒 Obfuscating: ${relativePath}`);
        obfuscateJS(filePath);
      } else if (ext === '.css') {
        const relativePath = path.relative(baseDir, filePath);
        console.log(`   🔒 Obfuscating & Minifying: ${relativePath}`);
        minifyCSS(filePath);
      }
    }
  }
}

// Prepare build directory (copy src to temp dir, compile SCSS, and process if in prod mode)
function prepareBuildDir() {
  // Always use temp directory to avoid modifying src files
  const tempDir = path.join(config.buildDir, '.temp-build');
  
  // Clean temp directory if it exists
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Copy src to temp directory
  fs.mkdirSync(tempDir, { recursive: true });
  copyDirectory(config.srcDir, tempDir);
  
  // Compile SCSS files to CSS (always compile, not just in prod)
  console.log('📦 Compiling SCSS files...');
  compileSCSSFiles(tempDir);
  
  if (prodMode) {
    // Process files (obfuscate JS, minify/obfuscate CSS)
    console.log('🔧 Processing files for production...');
    processFiles(tempDir);
  }
  
  return tempDir;
}

// Copy build to latest directory (unpacked)
function copyToLatest(buildDir, zipPath, zipFileName) {
  try {
    const latestDir = path.join(config.buildDir, 'latest');
    
    // Remove existing latest directory if it exists
    if (fs.existsSync(latestDir)) {
      fs.rmSync(latestDir, { recursive: true, force: true });
    }
    
    // Create latest directory
    fs.mkdirSync(latestDir, { recursive: true });
    
    // Copy all files from build directory to latest directory
    copyDirectory(buildDir, latestDir);
    
    console.log(`   Latest: ${latestDir} (unpacked)`);
  } catch (error) {
    console.warn(`⚠️  Could not copy to latest directory: ${error.message}`);
  }
}

// Recursively copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean build directory
function cleanBuildDir() {
  const buildPath = path.join(config.buildDir);
  if (fs.existsSync(buildPath)) {
    console.log('Cleaning build directory...');
    const files = fs.readdirSync(buildPath);
    files.forEach(file => {
      const filePath = path.join(buildPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && file !== 'latest') {
        // Don't delete the latest directory, just clean its contents
        fs.rmSync(filePath, { recursive: true, force: true });
      } else if (!stat.isDirectory()) {
        fs.unlinkSync(filePath);
      }
    });
    
    // Clean latest directory contents (recursively remove all contents)
    const latestDir = path.join(buildPath, 'latest');
    if (fs.existsSync(latestDir)) {
      const latestFiles = fs.readdirSync(latestDir);
      latestFiles.forEach(file => {
        const filePath = path.join(latestDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      });
    }
  }
}

// Create zip archive
function createZip() {
  return new Promise(async (resolve, reject) => {
    try {
      const version = getVersion();
      const zipFileName = `${config.extensionName}_${version}.zip`;
      const zipPath = path.join(config.buildDir, zipFileName);

      // Ensure build directory exists
      if (!fs.existsSync(config.buildDir)) {
        fs.mkdirSync(config.buildDir, { recursive: true });
      }

      // Remove existing zip if it exists
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      // Prepare build directory (process files if in prod mode)
      const buildSourceDir = prepareBuildDir();
      const buildMode = prodMode ? 'PRODUCTION' : 'DEVELOPMENT';
      console.log(`\n📦 Building in ${buildMode} mode...\n`);

      // Create archive
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(`\n✅ Build completed successfully!`);
        console.log(`   Archive: ${zipPath}`);
        console.log(`   Size: ${sizeInMB} MB`);
        
        // Copy to builds/latest directory
        copyToLatest(buildSourceDir, zipPath, zipFileName);
        
        // Clean temp directory (always clean up, not just in prod mode)
        if (fs.existsSync(buildSourceDir)) {
          fs.rmSync(buildSourceDir, { recursive: true, force: true });
        }
        
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        // Clean temp directory on error
        if (fs.existsSync(buildSourceDir)) {
          fs.rmSync(buildSourceDir, { recursive: true, force: true });
        }
        reject(err);
      });

      archive.pipe(output);

      // Add all files from build source directory
      archive.directory(buildSourceDir, false);

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

// Watch for file changes
function watchFiles() {
  const chokidar = require('chokidar');
  
  console.log('👀 Watching for file changes...');
  console.log('   Press Ctrl+C to stop\n');

  const watcher = chokidar.watch(config.srcDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });

  let buildTimeout;
  
  // Watch for .scss, .sass, .js, .css, .html, .json files
  watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.scss', '.sass', '.js', '.css', '.html', '.json'].includes(ext)) {
      clearTimeout(buildTimeout);
      buildTimeout = setTimeout(() => {
        console.log(`\n📝 File added: ${path.relative('.', filePath)}`);
        console.log('🔄 Rebuilding...\n');
        createZip().catch(err => {
          console.error('❌ Build failed:', err.message);
        });
      }, 300);
    }
  });

  watcher.on('change', (filePath) => {
    clearTimeout(buildTimeout);
    buildTimeout = setTimeout(() => {
      console.log(`\n📝 File changed: ${path.relative('.', filePath)}`);
      console.log('🔄 Rebuilding...\n');
      createZip().catch(err => {
        console.error('❌ Build failed:', err.message);
      });
    }, 300); // Debounce: wait 300ms after last change
  });

  watcher.on('ready', () => {
    console.log(`✅ Watching ${config.srcDir} for changes\n`);
  });
}

// Main build function
async function build() {
  try {
    if (cleanBeforeBuild) {
      cleanBuildDir();
    }

    await createZip();

    if (watchMode) {
      watchFiles();
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
build();

