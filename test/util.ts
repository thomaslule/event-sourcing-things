import { Entity } from "../src";

export class Cat extends Entity {
  public async feed() {
    if (this.getDecision().fed) {
      throw new Error("cat already fed!");
    }
    await this.publishAndApply({ type: "fed" });
  }

  public isFed() {
    return this.getDecision().fed;
  }
}

export const catFedReducer = (state = { fed: false }, event) => {
  if (event.type === "fed") {
    return { fed: true };
  }
  return state;
};

export const fedEvent = {
  aggregate: "cat",
  id: "felix",
  sequence: 0,
  insertDate: new Date("2018-01-01").toISOString(),
  type: "fed",
};
