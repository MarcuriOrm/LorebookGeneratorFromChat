# **Lorebook Generator (From Chat) for SillyTavern**

**Transform your chat history into "smart" memory (Lorebook) with a single click.**  
This extension automatically generates a World Info (Lorebook) file based on messages from your current chat. It's perfect for creating long-term character memory, summarizing events, or building a knowledge base.

## **✨ Features**

* **⚡ Vector-Ready:** Creates entries with the Vectorized (🔗) flag enabled. This allows SillyTavern to perform semantic similarity searches, not just keyword matching.
* **🧹 Smart Cleaning:** Automatically removes "noise" that can interfere with AI performance:
  * Strips out code blocks (\`\`\`...\`\`\`).
  * Removes HTML tags, CSS styles, and scripts (no more `style="color:..."` in memory!).
  * Leaves only clean dialogue text.
* **✂️ Smart Chunking:** Groups messages into logical blocks (chunks) based on user responses for better context.
* **💾 Auto-Save:** Attempts to save the lorebook directly to your SillyTavern folder. If server restrictions prevent this, it will offer a file download instead.

## **📦 Installation**

1. Open **SillyTavern**.
2. Go to **Extensions** -> **Install Extension**.
3. Paste the repository URL:
   `https://github.com/itsfantomas/LorebookGeneratorFromChat`
4. Click **Install** and refresh the page.

## **🚀 How to Use**

1. Open the character chat you want to convert into memory.
2. Click the **Extensions** menu in the top panel.
3. Find the **Lorebook Generator** panel on the right.
4. **Configure the settings:**
   * **Name:** Usually auto-populated (e.g., CharacterName_Lore).
   * **Start From / End At:** Use these if you want to process only a specific range of messages (e.g., from message 100 to 200). Leave blank to process the entire chat.
5. Click the **"Create and Save"** button.
6. ✅ **All Done!**
   * Refresh the page.
   * Navigate to the **World Info** menu (Globe icon 🌐).
   * Your new lorebook file will be there. Just attach it to your chat/character.

## **⚠️ Important Notes**

* **Vector Search:** For the lorebook to work effectively, ensure you have a Vectorization Source configured in your SillyTavern settings.
* **If Saving Fails:** Some server security settings might prevent the extension from creating files (a one-in-a-million chance, but still). In this case, the extension will **automatically download a .json file**. Simply import it manually via the World Info menu ("Import content").

*Created with ❤️ for the SillyTavern community*
