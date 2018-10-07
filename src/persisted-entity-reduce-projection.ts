import { Event } from "./event";
import { InMemoryReduceProjection } from "./in-memory-reduce-projection";
import { PersistedReduceProjection } from "./persisted-reduce-projection";
import { Rebuilder } from "./rebuilder";
import { Reducer } from "./reducer";
import { KeyValueStorage } from "./storage/key-value-storage";
import { ValueStorage } from "./storage/value-storage";

export class PersistedEntityReduceProjection<T> {
  constructor(
    private reducer: Reducer<T>,
    private storage: KeyValueStorage<T>,
    private eventFilter: (e: Event) => boolean = (e) => true) {
  }

  public async handleEvent(event: Event) {
    await this.getProjectionFor(event.id).handleEvent(event);
  }

  public async getState(id: string): Promise<T> {
    return this.getProjectionFor(id).getState();
  }

  public async getInMemoryProjection(id: string): Promise<InMemoryReduceProjection<T>> {
    return this.getProjectionFor(id).getInMemoryProjection();
  }

  public async storeState(id: string, state: T) {
    await this.getProjectionFor(id).storeState(state);
  }

  public getRebuilder(): Rebuilder {
    return new PersistedEntityReduceProjectionRebuilder(this.reducer, this.storage, this.eventFilter);
  }

  private getProjectionFor(id: string): PersistedReduceProjection<T> {
    return new PersistedReduceProjection(this.reducer, this.getStorageFor(id), this.eventFilter);
  }

  private getStorageFor(id: string): ValueStorage<T> {
    return {
      get: () => this.storage.get(id),
      store: (state) => this.storage.store(id, state),
    };
  }
}

class PersistedEntityReduceProjectionRebuilder<T> implements Rebuilder {
  private projections: { [id: string]: InMemoryReduceProjection<T> } = {};

  constructor(
    private reducer: Reducer<T>,
    private storage: KeyValueStorage<T>,
    private eventFilter: (e: Event) => boolean,
  ) {
  }

  public handleEvent(event: Event) {
    if (this.eventFilter(event)) {
      if (!this.projections[event.id]) {
        this.projections[event.id] = new InMemoryReduceProjection<T>(this.reducer);
      }
      this.projections[event.id].handleEvent(event);
    }
  }

  public async finalize() {
    const promises = Object.entries(this.projections)
      .map(([id, projection]) => this.storage.store(id, projection.getState()));
    await Promise.all(promises);
  }
}