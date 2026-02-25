from playwright.sync_api import sync_playwright
import time

def run():
    print("Launching browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to http://localhost:3000...")
        try:
            page.goto("http://localhost:3000")
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        # Inject locale
        print("Setting locale to 'en'...")
        page.evaluate("localStorage.setItem('rag-locale', 'en')")
        page.reload()

        print("Waiting for chat input...")
        # Wait for textarea
        try:
            page.wait_for_selector("textarea", timeout=10000)
        except Exception as e:
            print(f"Textarea not found: {e}")
            page.screenshot(path="verification_error.png")
            return

        print("Sending message...")
        page.fill("textarea", "Hello from Bolt")
        page.press("textarea", "Enter")

        # Wait for the user message bubble to appear
        # Text might be inside a div or span
        try:
            page.wait_for_selector("text=Hello from Bolt", timeout=5000)
        except:
            print("Message not found within timeout.")

        # Take a screenshot of the chat
        page.screenshot(path="verification_chat_msg.png")

        print("Creating new chat...")
        # Click "New Chat" button. Sidebar might be collapsed or expanded.
        # Try finding button with title "New chat" or aria-label="New chat" or text "New Chat"

        # Let's inspect the page source structure via locator logic
        # The sidebar has a button.
        try:
            # Try specific selector based on SessionSidebar.tsx
            # If expanded: button containing text "New Chat"
            # If collapsed: button with title="New chat"

            # Try to find the button
            btn = page.locator("button[title='New chat']").first
            if btn.is_visible():
                btn.click()
                print("Clicked New Chat button (by title)")
            else:
                # Try by text
                btn = page.locator("button:has-text('New Chat')").first
                if btn.is_visible():
                    btn.click()
                    print("Clicked New Chat button (by text)")
                else:
                    print("Could not find New Chat button.")
        except Exception as e:
            print(f"Error clicking New Chat: {e}")

        time.sleep(1) # Wait for UI update

        # Check if "New Chat" title appears in the header
        # Header title is inside an input or span depending on edit mode (default span)
        # It should say "New Chat"

        page.screenshot(path="verification_new_chat.png")
        print("Screenshots saved: verification_chat_msg.png, verification_new_chat.png")

        browser.close()

if __name__ == "__main__":
    run()
