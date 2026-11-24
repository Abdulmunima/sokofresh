import { describe, expect, it } from "vitest";
import { waLink } from "./whatsapp";

describe("waLink", () => {
  it("uses the number's digits without + or leading 0", () => {
    expect(waLink("0712 345 678", "Hi")).toBe("https://wa.me/254712345678?text=Hi");
    expect(waLink("+254712345678", "Hi")).toBe("https://wa.me/254712345678?text=Hi");
  });

  it("accepts other countries in E.164", () => {
    expect(waLink("+255712345678", "Hi")).toBe("https://wa.me/255712345678?text=Hi");
  });

  it("encodes the message, including new lines, symbols and Swahili", () => {
    const url = waLink("0712345678", "Oda #14\nJumla: Ksh 2,500 & asante!");
    expect(url).toBe(
      "https://wa.me/254712345678?text=Oda%20%2314%0AJumla%3A%20Ksh%202%2C500%20%26%20asante!",
    );
    expect(decodeURIComponent(new URL(url).searchParams.get("text")!)).toContain("Oda #14\n");
  });

  it("lets the user pick a contact when there is no valid number", () => {
    expect(waLink(null, "My order link")).toBe("https://wa.me/?text=My%20order%20link");
    expect(waLink("12345", "x")).toBe("https://wa.me/?text=x");
  });
});
