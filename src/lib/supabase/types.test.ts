import { describe, expect, it } from "vitest";
import { Constants } from "./database.types";

// Guards against the generated types drifting from the migrations the app relies on.
describe("generated database types", () => {
  it("has the order statuses in the PRD order", () => {
    expect(Constants.public.Enums.order_status).toEqual([
      "new",
      "confirmed",
      "packed",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ]);
  });

  it("has the three roles", () => {
    expect(Constants.public.Enums.member_role).toEqual(["owner", "manager", "staff"]);
  });
});
