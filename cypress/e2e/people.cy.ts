describe("Check or Create People for Test Company", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.login();
  });
  //   it("Check if Test Company exist", () => {
  //     cy.visit("/companies");
  //     cy.log("Waiting to load companies");
  //     cy.wait(2000);
  //     cy.get("body").then(($bd) => {
  //       if ($bd.find("a").text().includes("Test Company")) {
  //         cy.log("Test Company exists");
  //       } else {
  //         cy.log("Creating Test Company");
  //         cy.get("button").contains("New company").click();
  //         cy.get("input#name").type("Test Company");
  //         cy.get(`button[type="submit"]`).click();
  //         cy.get("body", { timeout: 10000 }).should("contain", "Test Company");
  //         cy.log("Test Company created");
  //       }
  //     });
  //   });
  it("Check if Test Person exists else create", () => {
    cy.visit("/people");
    cy.log("Waiting to load peoples");
    cy.wait(2000);
    cy.get("body", { timeout: 10000 }).should("contain", "People");
    cy.get("body").then(($bd) => {
      if ($bd.find("a").text().includes("Test Person")) {
        cy.log("Test Person already exists");
      } else {
        cy.log("Test Person does not exist");
        cy.get("button").contains("New person").click();
        cy.get(`input[placeholder="John"]`).type("Test");
        cy.get(`input[placeholder="Doe"]`).type("Person");
        cy.get("button").contains(`Select company`).click();
        cy.get(`input[placeholder="Search companies"]`).type("Test Company");
        cy.get("#searched-company").contains("Test Company").click();
        cy.get(`input[type="email"]`).type("test.person@testcompany.com");
        cy.get(`input[placeholder="+1 (123)-456-7890"]`).type(
          "+1 (123)-456-7890"
        );
        cy.get(`input[placeholder="Notes"]`).type("Test Note");
        cy.get(`button[type="submit"]`).click();
        cy.wait(10000);
        cy.get("body", { timeout: 10000 }).should("contain", "Test Person");
        cy.log("Test Person created");
      }
    });
  });
});
