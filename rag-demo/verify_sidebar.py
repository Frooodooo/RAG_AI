from playwright.sync_api import sync_playwright

def verify_sidebar_shortcut():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Force a specific viewport size
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Inject fake session data to ensure the sidebar is populated and visible
        # We need at least one session for the sidebar to be interactive in a meaningful way
        page.add_init_script("""
            localStorage.setItem('rag-chat-sessions', JSON.stringify([
                {
                    id: 'test-session-1',
                    title: 'Test Session',
                    messages: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]));
            localStorage.setItem('rag-sidebar-collapsed', 'false');
        """)

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for the sidebar to be visible (it has class 'session-sidebar')
        print("Waiting for sidebar...")
        sidebar = page.locator(".session-sidebar")
        page.wait_for_selector(".session-sidebar")

        # Check initial state: should not be collapsed
        print("Checking initial state...")
        classes = sidebar.get_attribute("class")
        if "collapsed" in classes:
            print("Error: Sidebar started collapsed!")
            browser.close()
            return

        # Press Ctrl+B
        print("Pressing Ctrl+B...")
        page.keyboard.press("Control+b")

        # Wait a bit for transition
        page.wait_for_timeout(500)

        # Check if collapsed class is added
        classes = sidebar.get_attribute("class")
        print(f"Classes after Ctrl+B: {classes}")
        if "collapsed" not in classes:
            print("Error: Sidebar did not collapse after Ctrl+B!")
        else:
            print("Success: Sidebar collapsed!")

        # Take screenshot of collapsed state
        page.screenshot(path="sidebar_collapsed.png")

        # Press Ctrl+B again to expand
        print("Pressing Ctrl+B again...")
        page.keyboard.press("Control+b")

        # Wait for transition
        page.wait_for_timeout(500)

        # Check if collapsed class is removed
        classes = sidebar.get_attribute("class")
        print(f"Classes after second Ctrl+B: {classes}")
        if "collapsed" in classes:
            print("Error: Sidebar did not expand after second Ctrl+B!")
        else:
            print("Success: Sidebar expanded!")

        # Check tooltip on the toggle button
        toggle_btn = page.locator("button[aria-label='Collapse sidebar']")
        # Note: aria-label flips based on state. When expanded, it says "Collapse sidebar"
        # The title should be "Collapse sidebar (Ctrl+B)"

        title = toggle_btn.get_attribute("title")
        print(f"Toggle button title: {title}")
        if "(Ctrl+B)" not in title:
             print("Error: Tooltip does not contain shortcut hint!")
        else:
             print("Success: Tooltip contains shortcut hint.")

        # Check aria-keyshortcuts
        keyshortcuts = toggle_btn.get_attribute("aria-keyshortcuts")
        print(f"Aria keyshortcuts: {keyshortcuts}")
        if keyshortcuts != "Control+b":
            print("Error: aria-keyshortcuts missing or incorrect!")
        else:
             print("Success: aria-keyshortcuts is correct.")

        page.screenshot(path="sidebar_expanded_verified.png")

        browser.close()

if __name__ == "__main__":
    verify_sidebar_shortcut()
