import json
from playwright.sync_api import sync_playwright

def verify_search_clear(page):
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

    page.goto("http://localhost:3000")

    # Inject local storage
    page.evaluate(f"localStorage.setItem('rag-chat-sessions', '{json.dumps(sessions)}');")
    page.reload()

    # Wait for search input
    search_input = page.get_by_placeholder("Search…")
    search_input.wait_for()

    # Type something
    search_input.fill("Session")

    # Find clear button
    clear_button = page.get_by_role("button", name="Clear search")

    # Verify attributes
    assert clear_button.is_visible()
    assert clear_button.get_attribute("title") == "Clear search"
    assert clear_button.get_attribute("type") == "button"

    print("Clear button found with correct attributes.")

    # Click clear
    clear_button.click()

    # Verify input cleared
    assert search_input.input_value() == ""
    print("Input cleared.")

    # Verify focus
    assert search_input.is_focused()
    print("Input focused.")

    # Take screenshot
    page.screenshot(path="verification_search_clear.png")
    print("Screenshot saved.")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify_search_clear(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="error.png")
    finally:
        browser.close()
