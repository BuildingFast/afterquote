describe("Auth0 Login", () => {
  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });
  it("successfully loads", () => {
    cy.visit("/");
  });
  it("Should login & display dashboard page", () => {
    cy.login();
    cy.get("body", { timeout: 10000 }).should(
      "contain",
      "Track and manage quote requests"
    );
  });
});
