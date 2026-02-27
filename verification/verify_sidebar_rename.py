from playwright.sync_api import sync_playwright
import time
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Pre-seed session data so we have something to rename
    sessions = [
        {
            "id": "test-session-1",
            "title": "Project Planning",
            "messages": [],
            "createdAt": "2023-10-27T10:00:00.000Z",
            "updatedAt": "2023-10-27T10:05:00.000Z"
        },
        {
            "id": "test-session-2",
            "title": "Budget Review",
            "messages": [],
            "createdAt": "2023-10-26T09:00:00.000Z",
            "updatedAt": "2023-10-26T09:30:00.000Z"
        }
    ]

    # Navigate to app
    page.goto("http://localhost:3000")

    # Inject data
    page.evaluate(f"localStorage.setItem('rag-chat-sessions', '{json.dumps(sessions)}')")
    page.evaluate("localStorage.setItem('rag-locale', 'en')")
    page.reload()

    # Wait for sidebar to load
    page.wait_for_selector("text=Project Planning")

    # Click the first session to select it
    page.click("text=Project Planning")

    # Focus the list item (simulating keyboard nav)
    # In a real scenario we'd tab to it, but here we can just focus the container if we find it
    # The session item has role="listitem"
    page.locator("div[role='listitem']").first.focus()

    # Press F2 to trigger rename
    page.keyboard.press("F2")

    # Wait for input to appear (it replaces the text)
    page.wait_for_selector("input.session-rename-input")

    # Type new name
    page.keyboard.type("Q4 Roadmap")
    page.keyboard.press("Enter")

    # Verify the new name is visible and input is gone
    page.wait_for_selector("text=Q4 Roadmap")
    if page.locator("input.session-rename-input").count() > 0:
        raise Exception("Rename input did not disappear")

    print("Rename successful!")

    # Take screenshot
    page.screenshot(path="verification/sidebar_rename_verified.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
