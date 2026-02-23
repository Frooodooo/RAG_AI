from playwright.sync_api import sync_playwright, expect
import time

def verify_chat(page):
    # 1. Load the app
    print("Loading app...")
    page.goto("http://localhost:3000")

    # Wait for welcome screen
    print("Waiting for welcome screen...")
    expect(page.get_by_text("Jautājiet jebko")).to_be_visible(timeout=10000)

    # 2. Send a message (creates Session 1)
    print("Clicking starter question 1...")
    # Using the first starter chip
    page.get_by_text("Kādi ir Rīgas pilsētas attīstības plāni?").click()

    # Wait for user message to appear
    print("Waiting for message...")
    # There might be sidebar item and chat message. Chat message is usually last or distinct.
    expect(page.get_by_text("Kādi ir Rīgas pilsētas attīstības plāni?", exact=True).last).to_be_visible()

    # Wait a bit for "AI" to start responding (it might be mocked or fail, but user message is there)
    time.sleep(2)

    # 3. Create New Chat (Session 2)
    print("Creating new chat...")
    page.get_by_role("button", name="Jauna saruna").click()

    # Wait for welcome screen again
    expect(page.get_by_text("Jautājiet jebko")).to_be_visible()

    # 4. Send another message
    print("Clicking starter question 2...")
    page.get_by_text("Kādi ir budžeta prioritātes šim gadam?").click()

    # Wait for user message
    expect(page.get_by_text("Kādi ir budžeta prioritātes šim gadam?", exact=True).last).to_be_visible()
    time.sleep(2)

    # 5. Switch back to Session 1
    # Sidebar items should be visible.
    # The first session title should be "Kā deklarēt dzīvesvietu?..."
    print("Switching back to first session...")
    # Find the session item in sidebar. It might be truncated.
    # Use get_by_text with partial match or exact if known.
    # The session title is auto-generated from message content.
    page.get_by_text("Kādi ir Rīgas pilsētas").first.click()

    # 6. Verify we are back in Session 1
    # We should see "Kādi ir Rīgas pilsētas attīstības plāni?" message in the chat area.
    expect(page.get_by_text("Kādi ir Rīgas pilsētas attīstības plāni?", exact=True).last).to_be_visible()

    # And NOT "Kur atrodas Rīgas dome?" in the chat area (it's in sidebar though)
    # The chat area message list.

    print("Taking screenshot...")
    page.screenshot(path="verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_chat(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error.png")
            raise e
        finally:
            browser.close()
