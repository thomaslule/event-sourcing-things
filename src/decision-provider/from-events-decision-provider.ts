import { DecisionSequence } from "../decision-sequence";
import { makeDecisionReducer } from "../make-decision-reducer";
import { InMemoryReduceProjection } from "../projection/in-memory-reduce-projection";
import { projectFromEvents } from "../projection/project-from-events";
import { Reducer } from "../reducer";
import { EventStorage } from "../storage/event-storage";
import { DecisionProvider } from "./decision-provider";

export class FromEventsDecisionProvider<T> implements DecisionProvider<T> {
  private reducer: Reducer<DecisionSequence<T>>;

  constructor(private aggregate: string, reducer: Reducer<T>, private eventStorage: EventStorage) {
    this.reducer = makeDecisionReducer(reducer);
  }

  public async getDecisionProjection(id: string): Promise<InMemoryReduceProjection<DecisionSequence<T>>> {
    const state = await projectFromEvents(this.reducer, this.eventStorage.getEvents(this.aggregate, id));
    return new InMemoryReduceProjection(this.reducer, state);
  }

}
