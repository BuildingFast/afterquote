describe("Check or New Company", () => {
  beforeEach(() => {
    // cy.clearCookies();
    // cy.clearLocalStorage();
    cy.visit("/");
    cy.login();
    cy.visit("/companies");
    cy.get("body", { timeout: 10000 }).should("contain", "Companies");
    cy.log("Waiting to load companies");
    cy.wait(2000);
  });
  it("Check if Test Company exists else create", () => {
    cy.get("body").then(($bd) => {
      if ($bd.find("a").text().includes("Test Company")) {
        cy.log("Test Company already exists");
      } else {
        cy.log("Test Company does not exist");
        cy.get("button").contains("New company").click();
        cy.get("input#name").type("Test Company");
        cy.get(`button[type="submit"]`).click();
        cy.get("body", { timeout: 10000 }).should("contain", "Test Company");
        cy.log("Test Company created");
      }
    });
  });
  it("Open Test Company Page", () => {
    cy.get("a").contains("Test Company").click();
    cy.get("body", { timeout: 10000 }).should("contain", "Test Company");
  });
});
