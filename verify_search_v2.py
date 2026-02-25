import json
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Inject sessions
        sessions = []
        for i in range(5):
            sessions.append({
                "id": f"session-{i}",
                "title": f"Session {i}",
                "messages": [],
                "createdAt": "2023-01-01T00:00:00.000Z",
                "updatedAt": "2023-01-01T00:00:00.000Z"
            })

        # Navigate
        page.goto("http://localhost:3000")

        # Inject local storage
        page.evaluate(f"localStorage.setItem('rag-chat-sessions', '{json.dumps(sessions)}');")
        page.reload()

        # Wait for search input
        search_input = page.get_by_placeholder("Search…")
        search_input.wait_for()

        # Fill input
        search_input.fill("Session")

        # Find clear button
        clear_button = page.get_by_role("button", name="Clear search")

        # Verify clear button attributes
        expect(clear_button).to_be_visible()
        expect(clear_button).to_have_attribute("title", "Clear search")
        expect(clear_button).to_have_attribute("type", "button")

        print("Clear button verified.")

        # Click clear
        clear_button.click()

        # Verify input cleared
        expect(search_input).to_have_value("")
        print("Input cleared.")

        # Verify focus
        expect(search_input).to_be_focused()
        print("Input focused.")

        # Take screenshot
        page.screenshot(path="verification_search_clear.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run()
