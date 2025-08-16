interface SaveableStore {
  saveState: () => any;
  loadState: (data: any) => void;
  resetToInitial: () => void;
}

class SaveLoadRegistry {
  private stores = new Map<string, SaveableStore>();

  register(name: string, store: SaveableStore) {
    this.stores.set(name, store);
  }

  saveAllStores(): Record<string, any> {
    const saveData: Record<string, any> = {};
    
    this.stores.forEach((store, name) => {
      try {
        saveData[name] = store.saveState();
      } catch (error) {
        console.error(`Failed to save store: ${name}`, error);
      }
    });
    
    return saveData;
  }

  loadAllStores(data: Record<string, any>) {
    this.stores.forEach((store, name) => {
      try {
        if (data[name]) {
          store.loadState(data[name]);
        }
      } catch (error) {
        console.error(`Failed to load store: ${name}`, error);
      }
    });
  }

  resetAllStores() {
    this.stores.forEach((store) => {
      try {
        store.resetToInitial();
      } catch (error) {
        console.error('Failed to reset store', error);
      }
    });
  }
}

export const saveLoadRegistry = new SaveLoadRegistry();
