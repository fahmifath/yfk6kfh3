// @ts-check

// ==== CONSTANTS ====

const MAX_CHORES = 20;
const MAX_CHORE_NAME_LENGTH = 50;
const STORAGE_KEY = 'choreWheelChores';

/** @typedef {{ id: string, name: string }} Chore */

/** @typedef {{ getItem: (key: string) => string | null, setItem: (key: string, value: string) => void, removeItem: (key: string) => void }} Storage */

// ==== LOGIC ====

/**
 * Generate a unique ID for a chore
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random suffix
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Validate a chore name
 * @param {string} name
 * @returns {{ valid: boolean, error: string }}
 */
export function validateChoreName(name) {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Chore name cannot be empty' };
  }
  
  if (trimmed.length > MAX_CHORE_NAME_LENGTH) {
    return { valid: false, error: `Chore name must be ${MAX_CHORE_NAME_LENGTH} characters or less` };
  }
  
  return { valid: true, error: '' };
}

/**
 * Add a new chore to the list
 * @param {Chore[]} chores
 * @param {string} name
 * @returns {{ chores: Chore[], error: string }}
 */
export function addChore(chores, name) {
  const validation = validateChoreName(name);
  
  if (!validation.valid) {
    return { chores, error: validation.error };
  }
  
  if (chores.length >= MAX_CHORES) {
    return { chores, error: `Maximum ${MAX_CHORES} chores allowed` };
  }
  
  const newChore = {
    id: generateId(),
    name: name.trim()
  };
  
  return { chores: [...chores, newChore], error: '' };
}

/**
 * Remove a chore by ID
 * @param {Chore[]} chores
 * @param {string} id
 * @returns {Chore[]}
 */
export function removeChore(chores, id) {
  return chores.filter(chore => chore.id !== id);
}

/**
 * Select a random chore from the list
 * @param {Chore[]} chores
 * @returns {Chore | null}
 */
export function selectRandomChore(chores) {
  if (chores.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * chores.length);
  return chores[randomIndex];
}

/**
 * Assign a color to a wheel segment based on index
 * @param {number} index
 * @returns {string}
 */
export function assignSegmentColor(index) {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#fd79a8', '#fdcb6e', '#00b894'
  ];
  return colors[index % colors.length];
}

/**
 * Format chore count with correct pluralization
 * @param {number} count
 * @returns {string}
 */
export function formatChoreCount(count) {
  return count === 1 ? '1 chore' : `${count} chores`;
}

/**
 * Load chores from storage
 * @param {Storage} storage
 * @returns {Chore[]}
 */
export function loadChores(storage) {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate structure
    if (!Array.isArray(parsed)) {
      console.error('Invalid chores data: not an array');
      return [];
    }
    
    // Validate each entry and cap to MAX_CHORES
    const validated = parsed
      .filter(item => 
        item && 
        typeof item === 'object' && 
        typeof item.id === 'string' && 
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        item.name.length <= MAX_CHORE_NAME_LENGTH
      )
      .slice(0, MAX_CHORES);
    
    return validated;
  } catch (error) {
    console.error('Failed to load chores:', error);
    return [];
  }
}

/**
 * Save chores to storage
 * @param {Chore[]} chores
 * @param {Storage} storage
 * @returns {void}
 */
export function saveChores(chores, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(chores));
  } catch (error) {
    console.error('Failed to save chores:', error);
  }
}
