// Simple encryption utility for sensitive data
// Note: This is basic encryption for demonstration. In production, use proper encryption libraries.

const ENCRYPTION_KEY = 'vistapro-secure-key-2025'; // In production, use environment variables

export const encryptData = (data) => {
  try {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    
    // Simple XOR encryption (for demonstration purposes)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

export const decryptData = (encryptedData) => {
  try {
    const decoded = atob(encryptedData); // Base64 decode
    
    // Simple XOR decryption
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    
    // Try to parse as JSON, if it fails return as string
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};

// Hash function for sensitive data
export const hashData = (data) => {
  try {
    let hash = 0;
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('Hashing error:', error);
    return '0';
  }
};


// Note: This is basic encryption for demonstration. In production, use proper encryption libraries.

const ENCRYPTION_KEY = 'vistapro-secure-key-2025'; // In production, use environment variables

export const encryptData = (data) => {
  try {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    
    // Simple XOR encryption (for demonstration purposes)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

export const decryptData = (encryptedData) => {
  try {
    const decoded = atob(encryptedData); // Base64 decode
    
    // Simple XOR decryption
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    
    // Try to parse as JSON, if it fails return as string
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};

// Hash function for sensitive data
export const hashData = (data) => {
  try {
    let hash = 0;
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('Hashing error:', error);
    return '0';
  }
};


