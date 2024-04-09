describe("New Sales Order", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.login();
    cy.visit("/orders");
    cy.get("body", { timeout: 10000 }).should(
      "contain",
      "Track and manage orders"
    );
    cy.get("button").contains("New Sales Order").click();
    cy.get("div[role='dialog']").should("exist");
    cy.get("div[role='dialog'] h2").should("contain", "New Sales Order");
  });
  it("Clicks the 'New Customer' button ", () => {
    cy.get("button").contains("New customer").click();
    cy.get("div[role='dialog'] p").should(
      "contain",
      "Add the customer's information. Click Save when you're done."
    );
    cy.get("input#name").type("Test Company");
    cy.get("#create-new-btn").click();
    cy.get("span.text-lg.font-semibold").should("contain", "Test Company");
    cy.get("div[role='dialog'] button[type='submit']").click();
    cy.get("button:contains('Go to Order')", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.log("New Sales Order Created");
  });
  it("Selects from Existing Customers", () => {
    cy.get("button").contains(`Select customer`).click();
    cy.get(`input[placeholder="Search customers"]`).type("Test Company");
    cy.get("#searched-customer").click();
    cy.get("span.text-lg.font-semibold").should("contain", "Test Company");
    cy.get("div[role='dialog'] button[type='submit']").click();
    cy.get("button:contains('Go to Order')", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.log("New Sales Order Created");
  });
});
