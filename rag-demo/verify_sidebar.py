from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Set locale to English
        context.add_init_script("localStorage.setItem('rag-locale', 'en')")

        page = context.new_page()

        # 1. Navigate to the app
        page.goto("http://localhost:3000")

        # Wait for sidebar to load
        sidebar = page.locator("aside.session-sidebar")
        expect(sidebar).to_be_visible()

        # Wait for initial load (sometimes takes a moment)
        page.wait_for_timeout(1000)

        # 2. Check Search Input
        # Assuming we have enough sessions to show search, but we might not.
        # If no sessions, search input is hidden: "sessions.length > 3"

        # We need to create some sessions first.
        # Click "New Chat" button multiple times.
        # Use exact=True to avoid partial matches if needed, but scoping to sidebar is safer.
        new_chat_btn = sidebar.get_by_role("button", name="New Chat")

        # Create 5 sessions to trigger search bar
        for _ in range(5):
            new_chat_btn.click()
            page.wait_for_timeout(300) # small delay

        # Now search input should be visible
        # It's inside the sidebar
        search_input = sidebar.get_by_placeholder("Search…")
        expect(search_input).to_be_visible()

        # 3. Type in search
        search_input.fill("Session")

        # 4. Clear button should appear
        # I added aria-label="Clear search"
        clear_btn = sidebar.get_by_role("button", name="Clear search")
        expect(clear_btn).to_be_visible()

        # 5. Click clear button
        clear_btn.click()

        # 6. Verify input is cleared
        expect(search_input).to_have_value("")

        # 7. Verify focus is back on input
        # Playwright's expect(locator).to_be_focused() checks if element is focused
        expect(search_input).to_be_focused()

        print("Search clear and focus restoration verified!")

        # Take screenshot
        page.screenshot(path="rag-demo/verification_sidebar.png")

        browser.close()

if __name__ == "__main__":
    run()
