const fs = require('fs').promises;
const path = require('path');
const config = require('../../config/default');
const { logger } = require('./logger');

/**
 * Initialize the data directory structure
 */
async function initializeDataStructure() {
  const directories = [
    config.storage.dataDir,
    config.storage.sessionsDir,
    config.storage.backupDir,
    path.join(config.storage.dataDir, 'messages'),
    path.join(config.storage.dataDir, 'auth'),
    path.dirname(config.logging.file)
  ];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        logger.error(`Failed to create directory ${dir}:`, error);
        throw error;
      }
    }
  }
  
  // Initialize users.json if it doesn't exist
  try {
    await fs.access(config.storage.usersFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJsonFile(config.storage.usersFile, {});
      logger.info('Created users.json file');
    }
  }
}

/**
 * Read JSON file with error handling
 */
async function readJsonFile(filePath, defaultValue = null) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`File not found: ${filePath}`);
      return defaultValue;
    }
    logger.error(`Error reading JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write JSON file with error handling and backup
 */
async function writeJsonFile(filePath, data) {
  try {
    // Ensure directory exists first
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Create backup if file exists
    try {
      await fs.access(filePath);
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // File doesn't exist, no backup needed
    }
    
    // Write file atomically with retry logic for Windows
    const tempFile = `${filePath}.tmp`;
    let retries = 3;
    
    while (retries > 0) {
      try {
        await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
        await fs.rename(tempFile, filePath);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          // If atomic write fails, try direct write as fallback
          logger.warn(`Atomic write failed for ${filePath}, using direct write`);
          await fs.writeFile(filePath, JSON.stringify(data, null, 2));
          break;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFile);
    } catch (error) {
      // Ignore cleanup errors
    }
    
    logger.debug(`Successfully wrote JSON file: ${filePath}`);
  } catch (error) {
    logger.error(`Error writing JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Update JSON file with a callback function
 */
async function updateJsonFile(filePath, updateCallback, defaultValue = {}) {
  try {
    const data = await readJsonFile(filePath, defaultValue);
    const updatedData = updateCallback(data);
    await writeJsonFile(filePath, updatedData);
    return updatedData;
  } catch (error) {
    logger.error(`Error updating JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Delete file with error handling
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    logger.debug(`Deleted file: ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }
}

/**
 * Get session directory path for a user
 */
function getSessionDir(username) {
  return path.join(config.storage.sessionsDir, username);
}

/**
 * Get session file path
 */
function getSessionFilePath(username, sessionId) {
  return path.join(getSessionDir(username), `${sessionId}.json`);
}

/**
 * Get session metadata file path
 */
function getSessionMetaFilePath(username, sessionId) {
  return path.join(getSessionDir(username), `${sessionId}.meta.json`);
}

/**
 * Get auth state directory path
 */
function getAuthStateDir(username, sessionId) {
  return path.join(getSessionDir(username), `${sessionId}_auth`);
}

/**
 * Create user session directory
 */
async function createUserSessionDir(username) {
  const userDir = getSessionDir(username);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

/**
 * List all session files for a user
 */
async function listUserSessions(username) {
  try {
    const userDir = getSessionDir(username);
    const files = await fs.readdir(userDir);
    return files
      .filter(file => file.endsWith('.meta.json'))
      .map(file => file.replace('.meta.json', ''));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Clean up session files
 */
async function cleanupSession(username, sessionId) {
  try {
    const sessionFile = getSessionFilePath(username, sessionId);
    const metaFile = getSessionMetaFilePath(username, sessionId);
    const authDir = getAuthStateDir(username, sessionId);
    
    await Promise.all([
      deleteFile(sessionFile),
      deleteFile(metaFile),
      fs.rmdir(authDir, { recursive: true }).catch(() => {})
    ]);
    
    logger.info(`Cleaned up session files for ${username}/${sessionId}`);
  } catch (error) {
    logger.error(`Error cleaning up session ${username}/${sessionId}:`, error);
    throw error;
  }
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`Directory ensured: ${dirPath}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      logger.error(`Error ensuring directory ${dirPath}:`, error);
      throw error;
    }
  }
}

/**
 * Read file data (for compatibility with older code)
 */
async function readFileData(filePath) {
  return await readJsonFile(filePath, {});
}

/**
 * Write file data (for compatibility with older code)
 */
async function writeFileData(filePath, data) {
  return await writeJsonFile(filePath, data);
}

module.exports = {
  initializeDataStructure,
  ensureDirectoryExists,
  readJsonFile,
  writeJsonFile,
  readFileData,
  writeFileData,
  updateJsonFile,
  deleteFile,
  getSessionDir,
  getSessionFilePath,
  getSessionMetaFilePath,
  getAuthStateDir,
  createUserSessionDir,
  listUserSessions,
  cleanupSession,
  getFileSize,
  fileExists
}; 