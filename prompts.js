// Prompt tile pools for MINEFIELD — DEFAULTS (immutable bake-in)
// Live pool lives at window.MINEFIELD_PROMPTS and is set by armory.jsx
window.MINEFIELD_DEFAULT_PROMPTS = {
  drink: [
    { title: "TAKE 2", body: "Two sips. No commentary." },
    { title: "WATERFALL", body: "Everyone drinks. Stop only when the player to your left stops." },
    { title: "POUR ONE OUT", body: "Pour a sip into someone else's glass. They drink it." },
    { title: "LEFT HAND", body: "Drink with your left hand for 3 rounds. Slip up = double sip." },
    { title: "MATCH ME", body: "Pick a player. Match their drink, sip-for-sip, until your next turn." },
    { title: "SOCIAL", body: "Everyone drinks. No exceptions." },
    { title: "CATEGORIES", body: "Name a category. Go around. First to blank or repeat drinks." },
    { title: "RHYME TIME", body: "Say a word. Player to your left rhymes. Loop until someone breaks." },
  ],
  dare: [
    { title: "ACCENT ON", body: "Adopt an accent. Hold it until your next turn." },
    { title: "TEXT ROULETTE", body: "Send the last emoji you used to the 3rd contact in your phone." },
    { title: "STAND UP", body: "You can't sit until you land on another tile." },
    { title: "MUTE BUTTON", body: "No speaking. Only gestures. Until next turn." },
    { title: "ICE BATH", body: "Hold an ice cube in your fist until it melts. Or take 3." },
    { title: "BEST IMPRESSION", body: "Do your best impression of the player on your right." },
    { title: "BACKWARDS", body: "Speak only in reverse order until your next turn." },
    { title: "CONFESSION", body: "Reveal something nobody in this room knows about you." },
  ],
  hotseat: [
    { title: "HOT SEAT", body: "Each player asks you one question. You must answer honestly — or drink." },
    { title: "MOST LIKELY", body: "Group votes: who is most likely to text their ex tonight?" },
    { title: "TRUTH TAX", body: "Answer truthfully: what's the worst thing you did this week?" },
    { title: "RANK THE ROOM", body: "Rank everyone here by who you'd trust with your phone unlocked." },
    { title: "ONE WORD", body: "Group describes you in one word each. You drink for any you disagree with." },
    { title: "WORST DATE", body: "Tell the table about your worst date. Spare no detail." },
  ],
  rule: [
    { title: "NEW RULE", body: "Make a rule. It stands until someone lands on another RULE tile." },
    { title: "NO NAMES", body: "Nobody can say anyone's first name. Slip up = 2 sips." },
    { title: "THUMB MASTER", body: "When you touch your thumb to the table, everyone must follow. Last one drinks." },
    { title: "QUESTION MASTER", body: "Until your next turn, anyone who answers your question drinks." },
  ],
  safe: [
    { title: "ALL CLEAR", body: "Nothing happens. Breathe." },
    { title: "MEDIC", body: "Pass your drink to anyone. They take a sip for you." },
    { title: "SHIELD", body: "Save this. Cancel one tile, any time, before reveal." },
  ],
};
