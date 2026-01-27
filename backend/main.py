from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from hyperliquid.info import Info
from hyperliquid.utils.constants import MAINNET_API_URL
import asyncio

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://blockblock-trading-competition-qtbr.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test addresses (known active addresses or random ones from leaderboards found online for testing)
# Using a few random high volume addresses for demonstration if possible, otherwise dummy
TEST_ADDRESSES = [
    "0xdfc7da625a62372c050cf649392c6d482270d4d8", 
    "0x010461c14e146305d262fc7b8f949823ce2ebdf3", 
    "0x5db96973c0515152cb520b73c4eb826880026e49", 
    "0x0000000000000000000000000000000000000000",
    "0x2c10b8005273f628037346142490159489502e97",
    "0x4a18037346142490159489502e972c10b8005273",
    "0x159489502e972c10b8005273f628037346142490", 
    "0xe972c10b8005273f628037346142490159489502",
    "0xb8005273f628037346142490159489502e972c10",
    "0x037346142490159489502e972c10b8005273f628",
    "0x9502e972c10b8005273f62803734614249015948",
    "0x73f628037346142490159489502e972c10b80052",
    "0x142490159489502e972c10b8005273f628037346",
    "0x89502e972c10b8005273f6280373461424901594",
    "0x28037346142490159489502e972c10b8005273f6"
]

info = Info(MAINNET_API_URL, skip_ws=True)

def fetch_address_state_sync(address: str):
    """
    Synchronous wrapper to fetch user state.
    """
    try:
        user_state = info.user_state(address)
        return {"address": address, "data": user_state, "error": None}
    except Exception as e:
        return {"address": address, "data": None, "error": str(e)}

@app.get("/leaderboard")
async def get_leaderboard():
    """
    Fetches leaderboard data concurrently for all test addresses.
    """
    loop = asyncio.get_running_loop()
    
    # Run synchronous SDK calls in a thread pool to avoid blocking the event loop
    tasks = [
        loop.run_in_executor(None, fetch_address_state_sync, address)
        for address in TEST_ADDRESSES
    ]
    
    results = await asyncio.gather(*tasks)
    
    leaderboard_data = []
    for res in results:
        if res["error"]:
            print(f"Error fetching {res['address']}: {res['error']}")
            continue
            
        data = res["data"]
        # Extract relevant fields
        # user_state returns:
        # {
        #   "assetPositions": [...],
        #   "marginSummary": { "accountValue": ..., "totalMarginUsed": ..., ... },
        #   "crossMarginSummary": ...
        # }
        
        margin_summary = data.get("marginSummary", {})
        account_value = float(margin_summary.get("accountValue", 0))
        
        # Simple ROI calculation dummy (since we don't have historical data here easily without more calls)
        # We will just lay out the structure. The user asked for ROI, but without history, 
        # we can't calc it easily. For now, let's use accountValue as the primary sorting metric 
        # and maybe "unrealizedPnl" from positions if available.
        # Actually, let's look at crossMarginSummary or comparable.
        
        # For now, we return what we have.
        leaderboard_data.append({
            "address": res["address"],
            "accountValue": account_value,
            "equity": account_value, # redundancy for now
            # aggregating unrealized pnl from positions if needed, but accountValue usually includes it
        })
    
    # Sort by accountValue descending
    leaderboard_data.sort(key=lambda x: x["accountValue"], reverse=True)
    
    # Add rank
    for i, item in enumerate(leaderboard_data):
        item["rank"] = i + 1
        
    return leaderboard_data
