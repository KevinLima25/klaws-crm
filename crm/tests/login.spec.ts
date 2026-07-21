import { test, expect } from "@playwright/test"

test.describe("CRM - Login Page", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/login")

    // Check the login form is visible
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
  })

  test("should switch to register mode", async ({ page }) => {
    await page.goto("/login")

    // Click on "Sign up" link
    await page.getByRole("button", { name: "Don't have an account? Sign up" }).click()

    // Check the register form is shown
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible()
  })
})

test.describe("CRM - Chat Page (Unauthenticated)", () => {
  test("should redirect to login when accessing CRM without auth", async ({ page }) => {
    await page.goto("/crm/chat")

    // Should be redirected to login (via middleware/proxy)
    await expect(page).toHaveURL(/\/login/)
  })
})
