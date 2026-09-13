// utils/logger.js

export function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

export function logError(message, error) {
    console.error(`[ERROR] ${message}`);
    if (error) console.error(error);
}

export function logDebug(message) {
    console.log(`[DEBUG] ${message}`);
}
