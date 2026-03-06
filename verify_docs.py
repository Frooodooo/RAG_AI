from playwright.sync_api import sync_playwright

def verify_document_list(page):
    # Set up mock API responses before navigation

    # Mock documents list
    page.route("**/doc-api/docs", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body="""
        [
            {
                "id": "doc-1",
                "filename": "sample_document.pdf",
                "status": "ready",
                "chunks": 42,
                "date": "2024-03-15T10:00:00Z",
                "fileSize": 102400
            }
        ]
        """
    ))

    # Mock health endpoint so the app doesn't complain about services being down
    page.route("**/api/health", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"qdrant": "ok", "ollama": "ok", "n8n": "ok"}'
    ))
    page.route("**/health", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"qdrant": "ok", "ollama": "ok", "n8n": "ok"}'
    ))

    # Go to the local dev server
    page.goto("http://localhost:3000")

    # Wait for the navigation rail and click the Documents tab
    documents_tab = page.locator("button.nav-btn").nth(2)
    documents_tab.wait_for(state="visible")
    documents_tab.click()

    # Wait for the mock document row to appear
    page.wait_for_selector("text=sample_document.pdf")

    # Click the search button to show the search panel
    search_btn = page.locator("button[title='Search within documents']", has_text="Meklēt")
    # if using EN locale, the text is "Search documents"
    if not search_btn.is_visible():
        search_btn = page.locator("button[title='Search within documents']")
    search_btn.click()

    # Wait a bit for animations
    page.wait_for_timeout(500)

    # focus the search documents input box
    page.locator("input[aria-label='Search documents']").focus()
    page.wait_for_timeout(300)
    page.screenshot(path="verification_search_focus.png")

    # Focus download button
    page.locator("button[aria-label='Download document']").focus()
    page.wait_for_timeout(300)
    page.screenshot(path="verification_download_focus.png")

    # Focus delete button
    page.locator("button[aria-label='Remove document']").focus()
    page.wait_for_timeout(300)
    page.screenshot(path="verification_delete_focus.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_document_list(page)
            print("Screenshots saved successfully.")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()