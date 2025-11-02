#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse version string (e.g., "1.2.3" or "1.2") to array [1, 2, 3]
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  // Ensure we always have 3 parts (major, minor, patch)
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts;
}

// Convert version array to string
function versionToString(version) {
  return version.join('.');
}

// Increment version based on type (patch, minor, major)
function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = parseVersion(version);

  switch (type.toLowerCase()) {
    case 'major':
      return versionToString([major + 1, 0, 0]);
    case 'minor':
      return versionToString([major, minor + 1, 0]);
    case 'patch':
    default:
      return versionToString([major, minor, patch + 1]);
  }
}

// Check if git repository is clean (no uncommitted changes)
function checkGitStatus() {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    // Not a git repository, allow version bump
    return true;
  }

  try {
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim().length > 0) {
      console.error('\n❌ Error: You have uncommitted changes!');
      console.error('\nPlease commit or stash your changes before bumping version.\n');
      console.error('Uncommitted files:');
      const lines = status.trim().split('\n');
      lines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        console.error(`   ${status} ${file}`);
      });
      console.error('\nTo see full status, run: git status\n');
      return false;
    }
    
    return true;
  } catch (error) {
    // If git status fails, allow version bump (might not be a git repo)
    console.warn('⚠️  Could not check git status, proceeding anyway...');
    return true;
  }
}

// Normalize version to always have 3 parts (major.minor.patch)
function normalizeVersion(version) {
  const parts = version.split('.').map(Number);
  // Ensure we always have 3 parts (major, minor, patch)
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.join('.');
}

// Update version in file
function updateVersionInFile(filePath, newVersion) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    if (!json.version) {
      console.warn(`⚠️  No version field found in ${filePath}`);
      return false;
    }

    const oldVersion = json.version;
    json.version = newVersion;
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${path.basename(filePath)}: ${oldVersion} → ${newVersion}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Create git tag for the new version
function createGitTag(version) {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    // Not a git repository, skip tagging
    return false;
  }

  try {
    // Normalize version to ensure it has 3 parts
    const normalizedVersion = normalizeVersion(version);
    const tagName = `v${normalizedVersion}`;
    
    // Check if tag already exists
    try {
      execSync(`git rev-parse "refs/tags/${tagName}"`, { stdio: 'ignore' });
      console.warn(`⚠️  Tag ${tagName} already exists, skipping tag creation`);
      return false;
    } catch (error) {
      // Tag doesn't exist, proceed to create it
    }
    
    // Create annotated tag
    execSync(`git tag -a "${tagName}" -m "Version ${normalizedVersion}"`, { stdio: 'inherit' });
    console.log(`✅ Created git tag: ${tagName}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not create git tag: ${error.message}`);
    return false;
  }
}

// Trigger build after version update
function triggerBuild() {
  try {
    console.log('\n🔨 Building extension with new version...\n');
    execSync('node build.js', { stdio: 'inherit' });
    console.log('\n✅ Build completed successfully!\n');
    return true;
  } catch (error) {
    console.warn(`\n⚠️  Build failed: ${error.message}`);
    console.warn('   You can manually run: npm run build\n');
    return false;
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  // Default to patch if no type specified
  let versionType = 'patch';
  
  if (args.length > 0) {
    const type = args[0].toLowerCase();
    if (['major', 'minor', 'patch'].includes(type)) {
      versionType = type;
    } else {
      console.error(`❌ Invalid version type: ${type}`);
      console.error('Usage: npm run version [major|minor|patch]');
      process.exit(1);
    }
  }

  // Read current version from manifest.json
  const manifestPath = path.join('src', 'manifest.json');
  let currentVersion;

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    currentVersion = manifest.version;
  } catch (error) {
    console.error(`❌ Error reading ${manifestPath}:`, error.message);
    process.exit(1);
  }

  if (!currentVersion) {
    console.error(`❌ No version found in ${manifestPath}`);
    process.exit(1);
  }

  // Check git status before proceeding
  if (!checkGitStatus()) {
    process.exit(1);
  }

  // Calculate new version
  const newVersion = incrementVersion(currentVersion, versionType);

  console.log(`\n🔄 Bumping version: ${versionType}`);
  console.log(`   ${currentVersion} → ${newVersion}\n`);

  // Update files
  let updated = false;
  updated |= updateVersionInFile(manifestPath, newVersion);
  updated |= updateVersionInFile('package.json', newVersion);

  if (updated) {
    // Create git tag for the new version
    createGitTag(newVersion);
    console.log(`\n✨ Version bumped successfully to ${newVersion}!\n`);
    
    // Trigger build with new version
    triggerBuild();
  } else {
    console.error('\n❌ Failed to update version');
    process.exit(1);
  }
}

main();

