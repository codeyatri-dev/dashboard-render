import asyncio
import datetime
import os
import json
from playwright.async_api import async_playwright

# ------------------------------
# Config
# ------------------------------
BASE_DIR = os.path.dirname(__file__)
PROFILE_URLS = ["https://www.instagram.com/code.yatri/"]
SESSION_FILE = os.path.join(BASE_DIR, "instagram_session.json")
HISTORY_FILE = os.path.join(BASE_DIR, "followers_history.json")
EXACT_FETCH_INTERVAL_HOURS = 24
last_exact_fetch = datetime.datetime.min

# Common Chromium args for container environments
CHROMIUM_ARGS = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--single-process",
    "--disable-extensions",
]

# ------------------------------
# Instagram Scraping
# ------------------------------
async def get_public_followers(url: str) -> str:
    """Safe public scraping (approximate)."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=CHROMIUM_ARGS)
            page = await browser.new_page()
            await page.goto(url)
            await asyncio.sleep(3)  # Give page time to load

            meta = await page.locator('meta[name="description"]').get_attribute('content')
            await browser.close()

            if meta and "Followers" in meta:
                # Extract number of followers from meta description
                followers_text = meta.split(" Followers")[0].split(",")[-1].strip()
                return followers_text
            return "0"
    except Exception as e:
        return f"Error: {str(e)}"


async def get_exact_followers(url: str) -> str:
    """Exact followers using saved session."""
    if not os.path.exists(SESSION_FILE):
        return await get_public_followers(url)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=CHROMIUM_ARGS)
            context = await browser.new_context(storage_state=SESSION_FILE)
            page = await context.new_page()
            await page.goto(url)
            await page.wait_for_selector('[aria-label$="followers"]', timeout=20000)

            followers = await page.evaluate("""() => {
                try {
                    if(window._sharedData){
                        return window._sharedData.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count.toString();
                    }
                } catch(e) {}
                return null;
            }""")
            await browser.close()
            return followers if followers else await get_public_followers(url)
    except Exception:
        return await get_public_followers(url)

# ------------------------------
# Save follower history
# ------------------------------
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

# ------------------------------
# Helper to run async coroutines from Flask sync routes
# ------------------------------
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
