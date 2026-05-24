/**
 * Storage debugging utilities
 */

export function getStorageStats() {
  let totalSize = 0;
  const itemSizes: Record<string, number> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      const size = value ? new Blob([value]).size : 0;
      itemSizes[key] = size;
      totalSize += size;
    }
  }
  
  return {
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    itemSizes: Object.entries(itemSizes).map(([key, size]) => ({
      key,
      size,
      sizeMB: (size / (1024 * 1024)).toFixed(2),
    })),
    estimatedLimit: '5-10 MB (browser dependent)',
  };
}

export function logStorageStats() {
  const stats = getStorageStats();
  console.log('=== LocalStorage Stats ===');
  console.log(`Total Size: ${stats.totalSizeMB} MB`);
  console.log(`Estimated Limit: ${stats.estimatedLimit}`);
  console.log('\nItems:');
  stats.itemSizes.forEach(item => {
    console.log(`  ${item.key}: ${item.sizeMB} MB (${item.size} bytes)`);
  });
  console.log('========================');
  return stats;
}

export function checkGuestDocuments(guestId: string) {
  const guestsData = localStorage.getItem('wedding_guests');
  if (!guestsData) {
    console.log('No guests found in storage');
    return null;
  }
  
  try {
    const guests = JSON.parse(guestsData);
    const guest = guests.find((g: any) => g.id === guestId);
    
    if (!guest) {
      console.log(`Guest ${guestId} not found`);
      return null;
    }
    
    console.log('=== Guest Document Info ===');
    console.log(`Name: ${guest.name}`);
    console.log(`Documents Count: ${guest.documents?.length || 0}`);
    
    if (guest.documents && guest.documents.length > 0) {
      console.log('\nDocuments:');
      guest.documents.forEach((doc: any, i: number) => {
        console.log(`  ${i + 1}. ${doc.fileName} (${doc.fileType}, ${(doc.fileSize / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log('No documents found');
    }
    console.log('=========================');
    
    return guest;
  } catch (err) {
    console.error('Error parsing guest data:', err);
    return null;
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).storageDebug = {
    getStats: getStorageStats,
    logStats: logStorageStats,
    checkGuest: checkGuestDocuments,
  };
  
  console.log('Storage debug tools available: window.storageDebug.logStats()');
}
