/// <reference types="cypress" />
export { };

Cypress.Commands.add("login", () => {
  const email = Cypress.env("AUTH0_TEST_EMAIL") as string;
  const password = Cypress.env("AUTH0_TEST_PASSWORD") as string;

  cy.visit("auth/signin/");
  cy.get(`button[id="signin-Auth0-web"]`).click();
  cy.wait(500);
  cy.get("input#username").type(email);
  cy.get("input#password").type(password, { log: false });
  cy.get(`button[type="submit"]`).last().click();
  cy.get(`button[id="signin-Auth0-web"]`).click();
  cy.url().should("include", "/quotes");
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}
