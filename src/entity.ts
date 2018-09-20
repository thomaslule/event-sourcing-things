import { DecisionSequence } from "./decision-sequence";
import { Event } from "./event";
import { Projection } from "./projection";

export abstract class Entity<TDecision> {
  constructor(
    private id: string,
    private decisionProjection: Projection<DecisionSequence<TDecision>>,
    private publish: (event: Event, decision: DecisionSequence<TDecision>) => Promise<void>,
  ) {
  }

  public getId(): string {
    return this.id;
  }

  public abstract getAggregate(): string;

  protected getDecision(): TDecision {
    return this.decisionProjection.getState().decision;
  }

  protected async publishAndApply(eventData: { [x: string]: any }): Promise<Event> {
    const sequence = this.decisionProjection.getState().sequence + 1;
    const insertDate = new Date().toISOString();
    const event: Event = { ...eventData, aggregate: this.getAggregate(), id: this.id, sequence, insertDate };
    this.decisionProjection.handleEvent(event);
    await this.publish(event, this.decisionProjection.getState());
    return event;
  }
}
