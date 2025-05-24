"""
Telegram Bot for AI Money Tracker

How to run:
1. Install dependencies:
   pip install python-telegram-bot requests python-dotenv
2. Set your Telegram bot token in a .env file in the bot/ directory:
   TELEGRAM_BOT_TOKEN=your_telegram_token_here
3. (Optional) Set API base URL in .env (default: http://localhost:9000)
   API_BASE_URL=http://localhost:9000
4. Create bot/telegram_users.json with Telegram user ID to app user ID mapping.
5. Run the bot:
   python bot/telegram_bot.py
"""
import os
import logging
import requests
import json
from dotenv import load_dotenv
from telegram import Update, ForceReply, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters, CallbackQueryHandler

# Load environment variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:9000')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load Telegram user mapping
TELEGRAM_USER_MAP_PATH = os.path.join(os.path.dirname(__file__), 'telegram_users.json')
if os.path.exists(TELEGRAM_USER_MAP_PATH):
    with open(TELEGRAM_USER_MAP_PATH, 'r') as f:
        TELEGRAM_USER_MAP = json.load(f)
else:
    TELEGRAM_USER_MAP = {}

def get_app_user_id(telegram_user_id):
    return TELEGRAM_USER_MAP.get(str(telegram_user_id))

# In-memory state to track if user is in /add mode
user_add_state = {}

# --- Add state for login flow ---
user_login_state = {}  # chat_id: {"step": "username"|"password", "username": str}
TOKEN_STORE_PATH = os.path.join(os.path.dirname(__file__), 'telegram_users.json')

def load_tokens():
    if os.path.exists(TOKEN_STORE_PATH):
        with open(TOKEN_STORE_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_tokens(tokens):
    with open(TOKEN_STORE_PATH, 'w') as f:
        json.dump(tokens, f)

def get_token(chat_id):
    tokens = load_tokens()
    return tokens.get(str(chat_id))

def set_token(chat_id, token):
    tokens = load_tokens()
    tokens[str(chat_id)] = token
    save_tokens(tokens)

def delete_token(chat_id):
    tokens = load_tokens()
    if str(chat_id) in tokens:
        del tokens[str(chat_id)]
        save_tokens(tokens)

# Inline (glass) buttons for main menu
def get_main_menu_inline_keyboard():
    keyboard = [
        [InlineKeyboardButton("➕ Add Transaction", callback_data="add")],
        [InlineKeyboardButton("📄 Latest Transactions", callback_data="latest")],
        [InlineKeyboardButton("❓ Help", callback_data="help")],
        [InlineKeyboardButton("👤 Who am I?", callback_data="whoami")]
    ]
    return InlineKeyboardMarkup(keyboard)

# Helper function to reply to either a message or a callback query
async def smart_reply(update, text, **kwargs):
    if hasattr(update, "message") and update.message:
        await update.message.reply_text(text, **kwargs)
    elif hasattr(update, "callback_query") and update.callback_query:
        await update.callback_query.message.reply_text(text, **kwargs)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_user.id
    token = get_token(chat_id)
    if not token:
        user_login_state[chat_id] = {"step": "username"}
        await smart_reply(update, "👋 Welcome! Please enter your username to log in:")
        return
    await smart_reply(
        update,
        "👋 Welcome back! Choose an option below.",
        reply_markup=get_main_menu_inline_keyboard()
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await smart_reply(
        update,
        "/start - Welcome message\n"
        "/help - Show this help\n"
        "/add - Add a new transaction (the next message will be parsed)\n"
        "/whoami - Show your Telegram and app user ID (for debugging)"
    )

async def whoami_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_user.id
    token = get_token(chat_id)
    await smart_reply(
        update,
        f"Your Telegram user ID: {chat_id}\n"
        f"Token: {'Set' if token else 'Not set'}"
    )

async def add_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_user.id
    token = get_token(chat_id)
    if not token:
        user_login_state[chat_id] = {"step": "username"}
        await smart_reply(update, "❌ You are not authorized. Please enter your username:")
        return
    user_add_state[chat_id] = True
    await smart_reply(
        update,
        "Please send your transaction description (e.g. 'I spent $50 on groceries')."
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_user.id
    text = update.message.text.strip()
    # --- Login flow ---
    if chat_id in user_login_state:
        state = user_login_state[chat_id]
        if state["step"] == "username":
            state["username"] = text
            state["step"] = "password"
            await smart_reply(update, "Please enter your password:")
            return
        elif state["step"] == "password":
            username = state["username"]
            password = text
            # Try to get token
            try:
                resp = requests.post(f"{API_BASE_URL}/api/token", data={"username": username, "password": password}, headers={"Content-Type": "application/x-www-form-urlencoded"})
                if resp.status_code == 200:
                    token = resp.json()["access_token"]
                    set_token(chat_id, token)
                    del user_login_state[chat_id]
                    await smart_reply(update, "✅ Login successful! You can now use the bot.")
                else:
                    await smart_reply(update, "❌ Login failed. Please enter your username again:")
                    state["step"] = "username"
            except Exception as e:
                await smart_reply(update, f"❌ Error: {e}\nPlease enter your username again:")
                state["step"] = "username"
            return
    # --- Normal flow ---
    token = get_token(chat_id)
    if not token:
        user_login_state[chat_id] = {"step": "username"}
        await smart_reply(update, "❌ You are not authorized. Please enter your username:")
        return
    # Now handle commands (e.g. /add) or transaction parsing
    if user_add_state.get(chat_id):
        await smart_reply(update, "Parsing your transaction with AI...")
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.post(f"{API_BASE_URL}/api/parse_transaction", json={"text": text}, headers=headers)
            if resp.status_code == 401:
                delete_token(chat_id)
                user_login_state[chat_id] = {"step": "username"}
                await smart_reply(update, "❌ Token expired or invalid. Please enter your username:")
                user_add_state[chat_id] = False
                return
            if not resp.ok:
                await smart_reply(update, f"❌ Failed to parse transaction: {resp.text}")
                user_add_state[chat_id] = False
                return
            data = resp.json()
            summary = (
                f"*Parsed Transaction:*\n"
                f"Name: {data.get('name')}\n"
                f"Date: {data.get('date')}\n"
                f"Amount: {data.get('price')} {'USD' if data.get('is_usd') else 'Toman'}\n"
                f"Category: {data.get('category_name')}\n"
                f"Source: {data.get('source_name')}\n"
                f"Type: {'Income' if data.get('is_deposit') else 'Expense'}"
            )
            await smart_reply(update, summary, parse_mode='Markdown')
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await smart_reply(update, "❌ An error occurred while processing your request.")
        finally:
            user_add_state[chat_id] = False
    else:
        await smart_reply(update,
            "To add a transaction, use /add and then send your transaction description."
        )

async def latest_transactions_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_user.id
    token = get_token(chat_id)
    if not token:
        await smart_reply(update, "❌ You are not authorized. Please log in first.")
        return
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{API_BASE_URL}/api/transactions", headers=headers)
        if resp.status_code == 401:
            delete_token(chat_id)
            user_login_state[chat_id] = {"step": "username"}
            await smart_reply(update, "❌ Token expired or invalid. Please enter your username:")
            return
        if not resp.ok:
            await smart_reply(update, f"❌ Failed to fetch transactions: {resp.text}")
            return
        transactions = resp.json()
        if not transactions:
            await smart_reply(update, "No transactions found.")
            return
        # Sort by date descending (if not already sorted)
        transactions.sort(key=lambda x: x.get('date', ''), reverse=True)
        latest = transactions[:5]
        msg = "<b>📄 Latest 5 Transactions</b>\n\n"
        for idx, t in enumerate(latest, 1):
            amount = t.get('price', 0)
            currency = '💵 USD' if t.get('is_usd') else '💴 Toman'
            category = t.get('category', '') or '—'
            source = t.get('source', '') or '—'
            msg += (
                f"<b>{idx}.</b> <b>{t.get('name', '')}</b>\n"
                f"   📅 <b>Date:</b> {t.get('date', '')}\n"
                f"   💰 <b>Amount:</b> <code>{amount}</code> {currency}\n"
                f"   🏷️ <b>Category:</b> {category}\n"
                f"   🏦 <b>Source:</b> {source}\n"
                f"<i>───────────────</i>\n"
            )
        await smart_reply(update, msg, parse_mode='HTML')
    except Exception as e:
        await smart_reply(update, f"❌ Error: {e}")

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    # Use the same chat_id logic as in other handlers
    if data == "add":
        await add_command(update, context)
    elif data == "help":
        await help_command(update, context)
    elif data == "whoami":
        await whoami_command(update, context)
    elif data == "latest":
        await latest_transactions_command(update, context)
    await query.answer()

async def set_bot_commands(application):
    commands = [
        BotCommand("start", "Start the bot"),
        BotCommand("add", "Add a new transaction"),
        BotCommand("help", "Show help"),
        BotCommand("whoami", "Show your Telegram and app user ID"),
    ]
    await application.bot.set_my_commands(commands)

if __name__ == "__main__":
    if not TELEGRAM_BOT_TOKEN:
        print("Please set TELEGRAM_BOT_TOKEN in bot/.env")
        exit(1)
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).post_init(set_bot_commands).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("add", add_command))
    app.add_handler(CommandHandler("whoami", whoami_command))
    app.add_handler(CallbackQueryHandler(button_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("Bot is running. Press Ctrl+C to stop.")
    app.run_polling() 