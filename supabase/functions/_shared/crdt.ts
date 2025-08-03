export interface VectorClock {
  [actorId: string]: number;
}

export interface CRDTOperation {
  type: string;
  data: any;
  vectorClock: VectorClock;
  actorId: string;
  timestamp: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  vectorClock: VectorClock;
  version: number;
  lastModifiedBy: string;
}

/**
 * CRDT Implementation for Video Metadata
 * Uses Last-Writer-Wins (LWW) strategy with vector clocks for conflict resolution
 */
export class VideoCRDT {
  /**
   * Increment vector clock for an actor
   */
  static incrementVectorClock(currentClock: VectorClock, actorId: string): VectorClock {
    const newClock = { ...currentClock };
    newClock[actorId] = (newClock[actorId] || 0) + 1;
    return newClock;
  }

  /**
   * Merge two vector clocks by taking the maximum value for each actor
   */
  static mergeVectorClocks(clock1: VectorClock, clock2: VectorClock): VectorClock {
    const allActors = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
    const merged: VectorClock = {};
    
    for (const actor of allActors) {
      merged[actor] = Math.max(clock1[actor] || 0, clock2[actor] || 0);
    }
    
    return merged;
  }

  /**
   * Compare vector clocks to determine ordering
   * Returns: 'before' | 'after' | 'concurrent'
   */
  static compareVectorClocks(clock1: VectorClock, clock2: VectorClock): 'before' | 'after' | 'concurrent' {
    const actors1 = Object.keys(clock1);
    const actors2 = Object.keys(clock2);
    const allActors = new Set([...actors1, ...actors2]);

    let clock1Greater = false;
    let clock2Greater = false;

    for (const actor of allActors) {
      const val1 = clock1[actor] || 0;
      const val2 = clock2[actor] || 0;

      if (val1 > val2) {
        clock1Greater = true;
      } else if (val2 > val1) {
        clock2Greater = true;
      }
    }

    if (clock1Greater && !clock2Greater) {
      return 'after';
    } else if (clock2Greater && !clock1Greater) {
      return 'before';
    } else {
      return 'concurrent';
    }
  }

  /**
   * Merge two video metadata objects using CRDT rules
   */
  static mergeVideoMetadata(local: VideoMetadata, remote: VideoMetadata): VideoMetadata {
    const comparison = this.compareVectorClocks(local.vectorClock, remote.vectorClock);
    
    // If one clearly happened after the other, use the later one
    if (comparison === 'after') {
      return local;
    } else if (comparison === 'before') {
      return remote;
    }
    
    // For concurrent updates, use Last-Writer-Wins based on timestamp
    // In practice, we'll use the one with the higher version number
    const winner = local.version >= remote.version ? local : remote;
    
    // Merge vector clocks
    const mergedClock = this.mergeVectorClocks(local.vectorClock, remote.vectorClock);
    
    return {
      ...winner,
      vectorClock: mergedClock,
      version: Math.max(local.version, remote.version),
    };
  }

  /**
   * Create a new CRDT operation
   */
  static createOperation(
    type: string,
    data: any,
    actorId: string,
    currentClock: VectorClock
  ): CRDTOperation {
    return {
      type,
      data,
      vectorClock: this.incrementVectorClock(currentClock, actorId),
      actorId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply an operation to video metadata
   */
  static applyOperation(metadata: VideoMetadata, operation: CRDTOperation): VideoMetadata {
    const newMetadata = { ...metadata };
    
    // Update vector clock
    newMetadata.vectorClock = this.mergeVectorClocks(
      metadata.vectorClock,
      operation.vectorClock
    );
    
    // Apply the operation based on type
    switch (operation.type) {
      case 'update_title':
        newMetadata.title = operation.data.title;
        break;
      case 'update_description':
        newMetadata.description = operation.data.description;
        break;
      case 'update_category':
        newMetadata.category = operation.data.category;
        break;
      case 'add_tag':
        if (!newMetadata.tags.includes(operation.data.tag)) {
          newMetadata.tags = [...newMetadata.tags, operation.data.tag];
        }
        break;
      case 'remove_tag':
        newMetadata.tags = newMetadata.tags.filter(tag => tag !== operation.data.tag);
        break;
      case 'set_tags':
        newMetadata.tags = operation.data.tags;
        break;
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
    }
    
    newMetadata.lastModifiedBy = operation.actorId;
    newMetadata.version += 1;
    
    return newMetadata;
  }

  /**
   * Resolve conflicts between multiple operations
   */
  static resolveConflicts(operations: CRDTOperation[]): CRDTOperation[] {
    // Sort operations by vector clock ordering
    return operations.sort((a, b) => {
      const comparison = this.compareVectorClocks(a.vectorClock, b.vectorClock);
      if (comparison === 'before') return -1;
      if (comparison === 'after') return 1;
      
      // For concurrent operations, sort by timestamp
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }
}

/**
 * G-Set CRDT for tags (Grow-only Set)
 * Tags can only be added, never removed (for this implementation)
 */
export class GSetCRDT<T> {
  private elements: Set<T>;

  constructor(elements: T[] = []) {
    this.elements = new Set(elements);
  }

  add(element: T): void {
    this.elements.add(element);
  }

  has(element: T): boolean {
    return this.elements.has(element);
  }

  values(): T[] {
    return Array.from(this.elements);
  }

  merge(other: GSetCRDT<T>): GSetCRDT<T> {
    const merged = new GSetCRDT<T>();
    merged.elements = new Set([...this.elements, ...other.elements]);
    return merged;
  }

  toJSON(): T[] {
    return this.values();
  }

  static fromJSON<T>(data: T[]): GSetCRDT<T> {
    return new GSetCRDT(data);
  }
}

/**
 * LWW-Register CRDT for single values with timestamps
 */
export class LWWRegister<T> {
  constructor(
    public value: T,
    public timestamp: number,
    public actorId: string
  ) {}

  update(newValue: T, actorId: string): LWWRegister<T> {
    return new LWWRegister(newValue, Date.now(), actorId);
  }

  merge(other: LWWRegister<T>): LWWRegister<T> {
    // Last writer wins based on timestamp
    // If timestamps are equal, use actor ID for deterministic ordering
    if (this.timestamp > other.timestamp) {
      return this;
    } else if (other.timestamp > this.timestamp) {
      return other;
    } else {
      // Timestamps equal, use actor ID for tie-breaking
      return this.actorId > other.actorId ? this : other;
    }
  }

  toJSON(): { value: T; timestamp: number; actorId: string } {
    return {
      value: this.value,
      timestamp: this.timestamp,
      actorId: this.actorId,
    };
  }

  static fromJSON<T>(data: { value: T; timestamp: number; actorId: string }): LWWRegister<T> {
    return new LWWRegister(data.value, data.timestamp, data.actorId);
  }
}
