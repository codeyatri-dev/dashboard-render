import asyncio
import datetime
import os
import json
from playwright.async_api import async_playwright

# Instagram Config
PROFILE_URLS = ["https://www.instagram.com/code.yatri/"]
SESSION_FILE = "instagram_session.json"
HISTORY_FILE = "followers_history.json"
EXACT_FETCH_INTERVAL_HOURS = 24
last_exact_fetch = datetime.datetime.min


async def get_public_followers(url: str) -> str:
    """Safe public scraping (approximate)."""
    try:
        async with async_playwright() as p:
            # Add common sandbox args (helpful in CI/WSL/Docker environments)
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
            page = await browser.new_page()
            await page.goto(url)
            await asyncio.sleep(2)

            meta = await page.locator('meta[name="description"]').get_attribute('content')
            if meta and "Followers" in meta:
                followers_text = meta.split(" Followers")[0].split(",")[-1].strip()
            else:
                followers_text = "Not Found"

            await browser.close()
            return followers_text
    except Exception as e:
        return f"Error: {str(e)}"


async def get_exact_followers(url: str) -> str:
    """Exact followers using saved session."""
    if not os.path.exists(SESSION_FILE):
        return await get_public_followers(url)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
            context = await browser.new_context(storage_state=SESSION_FILE)
            page = await context.new_page()
            await page.goto(url)
            await page.wait_for_selector('[aria-label$="followers"]', timeout=10000)

            followers = await page.evaluate("""() => {
                try {
                    if(window._sharedData){
                        return window._sharedData.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count.toString();
                    }
                } catch(e) {}
                return null;
            }""")
            await browser.close()

            if followers:
                return followers
            else:
                return await get_public_followers(url)
    except Exception:
        return await get_public_followers(url)


def save_follower_history(username: str, count: int):
    today = datetime.date.today().isoformat()
    history = {}
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r') as f:
            try:
                history = json.load(f)
            except Exception:
                history = {}
    if username not in history:
        history[username] = {}
    history[username][today] = count
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)


# Helper to run Playwright async coroutines from sync Flask routes without interfering with any running loop
def run_coro(coro):
    loop = None
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    finally:
        if loop:
            try:
                loop.close()
            except:
                pass
