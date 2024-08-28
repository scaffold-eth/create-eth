/// <reference types="cypress" />

describe("example app", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("should get eth from faucet", () => {
    cy.get("[data-test=faucet-button]").should("have.length", 1);
    cy.get("[data-test=faucet-button]").first().click();

    cy.get("[data-test=formatted-balance]").should("exist");
    cy.get("[data-test=formatted-balance]").first().should("have.text", "1.0000");
  });
});
