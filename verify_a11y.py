from playwright.sync_api import sync_playwright, expect

def verify_feature(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(1000)

    # 1. Verify EN toggle aria-label and title
    en_toggle = page.locator('button:text-is("en")')
    expect(en_toggle).to_be_visible()

    # Check Latvian dictionary values first (default language)
    expect(en_toggle).to_have_attribute("aria-label", "Angļu: en")
    expect(en_toggle).to_have_attribute("title", "Angļu")

    # Click to switch to English
    en_toggle.click()
    page.wait_for_timeout(500)

    # Verify EN toggle updated to English dictionary values
    expect(en_toggle).to_have_attribute("aria-label", "English: en")
    expect(en_toggle).to_have_attribute("title", "English")

    # 2. Verify LV toggle aria-label and title in English dictionary
    lv_toggle = page.locator('button:text-is("lv")')
    expect(lv_toggle).to_be_visible()
    expect(lv_toggle).to_have_attribute("aria-label", "Latvian: lv")
    expect(lv_toggle).to_have_attribute("title", "Latvian")

    # 3. Create a chat session to verify rename button
    textarea = page.locator('textarea').first
    textarea.fill("Hello")
    textarea.press("Enter")
    page.wait_for_timeout(1000)

    # 4. Verify rename button in English dictionary
    rename_btn = page.locator('button[aria-label^="Rename chat:"]')
    expect(rename_btn).to_be_visible()
    expect(rename_btn).to_have_attribute("title", "Rename chat")

    # Take screenshot of the new chat with rename button
    page.screenshot(path="/home/jules/verification/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/video", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()
