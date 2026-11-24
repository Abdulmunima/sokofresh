import type { Database } from "./database.types";

type PublicSchema = Database["public"];

/** A row from a table, e.g. `Row<"products">`. */
export type Row<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
/** Insert shape for a table. */
export type Insert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
/** Update shape for a table. */
export type Update<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
/** A row from a view, e.g. `ViewRow<"customer_balances">`. */
export type ViewRow<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
/** An enum, e.g. `Enum<"order_status">`. */
export type Enum<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type { Database };
