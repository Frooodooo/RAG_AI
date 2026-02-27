import time
from playwright.sync_api import sync_playwright

def verify_shortcuts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant clipboard permissions to allow reading/writing clipboard
        context = browser.new_context(permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()

        # 1. Load app and set up initial state
        page.goto("http://localhost:3000")

        # Inject some sessions to work with
        sessions_json = '[{"id":"s1","title":"Session 1","messages":[],"createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"},{"id":"s2","title":"Session 2","messages":[],"createdAt":"2023-01-02T00:00:00.000Z","updatedAt":"2023-01-02T00:00:00.000Z"}]'
        page.evaluate(f"localStorage.setItem('rag-chat-sessions', '{sessions_json}')")
        page.reload()

        # Wait for sidebar to load
        page.wait_for_selector("text=Session 1")

        print("Initial load complete. Testing F2 rename...")

        # 2. Test F2 Rename
        # Click the first session to select/focus it
        session_item = page.get_by_role("listitem").first
        session_item.click()

        # Press F2
        page.keyboard.press("F2")

        # Check if input appears (it has class 'session-rename-input')
        rename_input = page.locator(".session-rename-input")
        if rename_input.is_visible():
            print("SUCCESS: F2 triggered rename input")
            # Rename it
            rename_input.fill("Renamed Session")
            page.keyboard.press("Enter")
            # Verify new title
            page.wait_for_selector("text=Renamed Session")
            print("SUCCESS: Session renamed successfully")
        else:
            print("FAILURE: F2 did not trigger rename input")

        # 3. Test Ctrl+B Toggle
        print("\nTesting Ctrl+B toggle...")
        sidebar = page.locator(".session-sidebar")

        # Initially expanded?
        initial_width = sidebar.evaluate("el => el.getBoundingClientRect().width")
        print(f"Initial sidebar width: {initial_width}px")

        # Press Ctrl+B
        page.keyboard.press("Control+b")
        time.sleep(0.5) # Wait for transition

        collapsed_width = sidebar.evaluate("el => el.getBoundingClientRect().width")
        print(f"Collapsed sidebar width: {collapsed_width}px")

        if collapsed_width < initial_width:
            print("SUCCESS: Ctrl+B collapsed the sidebar")
        else:
            print("FAILURE: Ctrl+B did not collapse the sidebar")

        # Press Ctrl+B again to expand
        page.keyboard.press("Control+b")
        time.sleep(0.5)
        expanded_width = sidebar.evaluate("el => el.getBoundingClientRect().width")
        print(f"Expanded sidebar width: {expanded_width}px")

        if expanded_width > collapsed_width:
            print("SUCCESS: Ctrl+B expanded the sidebar")
        else:
            print("FAILURE: Ctrl+B did not expand the sidebar")

        # Take screenshot
        page.screenshot(path="verification_shortcuts.png")
        print("\nScreenshot saved to verification_shortcuts.png")

        browser.close()

if __name__ == "__main__":
    try:
        verify_shortcuts()
    except Exception as e:
        print(f"Error: {e}")
