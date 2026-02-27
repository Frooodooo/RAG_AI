from playwright.sync_api import sync_playwright

def verify_sidebar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to the app (assuming it's running on port 3000)
            page.goto("http://localhost:3000")

            # Wait for sidebar to load
            sidebar = page.locator(".session-sidebar")
            sidebar.wait_for()

            # Check initial state (should not be collapsed)
            classes = sidebar.get_attribute("class")
            print(f"Initial classes: {classes}")
            if "collapsed" in classes:
                raise Exception("Sidebar started collapsed, expected expanded.")

            # Trigger Ctrl+B
            print("Pressing Ctrl+B...")
            page.keyboard.press("Control+b")

            # Wait for collapsed class
            # We can use expect-like wait logic or just wait for selector
            page.wait_for_selector(".session-sidebar.collapsed", timeout=2000)

            print("Sidebar successfully collapsed!")
            page.screenshot(path="verification_collapsed.png")

            # Trigger Ctrl+B again to expand
            print("Pressing Ctrl+B again...")
            page.keyboard.press("Control+b")

            # Wait for collapsed class to disappear
            # We wait until .session-sidebar.collapsed is NOT present
            # A simple way is to wait for the generic selector and check classes again
            page.wait_for_timeout(500) # simple wait for transition start

            classes_after = sidebar.get_attribute("class")
            if "collapsed" in classes_after:
                 # It might take a moment to remove class in React state
                 page.wait_for_function("!document.querySelector('.session-sidebar').classList.contains('collapsed')")

            print("Sidebar successfully expanded!")
            page.screenshot(path="verification_expanded.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    verify_sidebar()
