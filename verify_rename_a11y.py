from playwright.sync_api import Page, expect, sync_playwright

def verify_feature(page: Page):
  page.goto("http://localhost:4173")
  page.wait_for_timeout(500)

  # Start a new chat to have a session in the sidebar
  page.get_by_role("button", name="New Chat").first.click()
  page.wait_for_timeout(500)

  # Send a message so the session persists and gets a title
  # Send a message so the session persists and gets a title
  textarea = page.locator('textarea').first
  textarea.fill("hi")
  textarea.press("Enter")
  page.wait_for_timeout(1500)

  # The active session should now be selectable in the sidebar
  session_item = page.locator('div[role="listitem"]').first
  session_item.click()
  page.wait_for_timeout(500)

  # Double click to rename in the sidebar
  session_item.dblclick()
  page.wait_for_timeout(500)

  # Verify the rename input appears with the aria-label (lv default)
  rename_input = page.locator('input[aria-label="Pārdēvēt sarunu"]').first
  expect(rename_input).to_be_visible()

  page.screenshot(path="/home/jules/verification/sidebar_rename.png")
  page.wait_for_timeout(500)

  # Press Escape to cancel rename in sidebar
  rename_input.press("Escape")
  page.wait_for_timeout(500)

  # Click the rename button in the ChatHeader
  page.locator('button[title="Click to rename"]').click()
  page.wait_for_timeout(500)

  # Verify the header rename input appears with the aria-label
  header_rename_input = page.locator('input[aria-label="Pārdēvēt sarunu"]').first
  expect(header_rename_input).to_be_visible()

  page.screenshot(path="/home/jules/verification/header_rename.png")
  page.wait_for_timeout(1000)

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(record_video_dir="/home/jules/verification/video")
    page = context.new_page()
    try:
      verify_feature(page)
    finally:
      context.close()
      browser.close()
