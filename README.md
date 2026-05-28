# 📋 HabitCraft

A minimalist monthly habit tracker with spreadsheet-style interaction — lightweight, offline-ready, and built using vanilla HTML, CSS, and JavaScript.
---

## ✨ Features

| Feature | Description |
|---|---|
| ✅ **Checkbox Grid** | Tick checkboxes for each habit × each day of the month |
| 📅 **Auto Monthly Refresh** | Each new month starts with a clean slate automatically |
| 📊 **Daily Progress Chart** | Bar chart showing daily completion % |
| 📈 **Weekly Progress Chart** | Bar chart with weekly aggregates (Week 1–5) |
| 🍩 **Overall Stats Donut** | Pie/donut showing completed vs remaining |
| 📑 **Analysis Table** | Goal / Actual / Left / Progress bar / % per habit |
| 🏆 **Top 10 Habits** | Ranked by completion percentage |
| 😊 **Mood & Motivation** | Click to log daily mood/motivation (1–10 scale) |
| 🧠 **Mental Stats Chart** | Area chart visualizing mood & motivation trends |
| ⚙️ **Fully Customizable** | Add, edit, delete habits with emoji + color picker |
| 💾 **Local Storage** | All data persists in browser — no server needed |
| ⬇️ **Export / Import** | Backup & restore as JSON |
| 📆 **Calendar Settings** | Switch year & month to view/edit any period |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/habit-tracker.git

# Open directly in browser
open habit-tracker/index.html
```

That's it. No build step. No npm install. No framework.

---

## 🌐 Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Source: `main` branch, `/ (root)` folder
4. Your tracker is live at `https://YOUR_USERNAME.github.io/habit-tracker/`

---

## 📁 Project Structure

```
HabitCraft/
├── index.html      ← Main application structure
├── style.css       ← Styling and responsive design
├── script.js       ← App functionality and logic
├── README.md       ← Project documentation
├── LICENSE         ← MIT License
└── .gitignore      ← Ignored files and folders
```

---

## 🛠️ How to Use

| Action | How |
|---|---|
| ✅ Check a habit | Click the checkbox in the grid |
| ➕ Add a habit | Click **+ Add Habit** button |
| ✏️ Edit a habit | Click the ✏️ icon on the habit row |
| ❌ Delete a habit | Click the ✕ icon on the habit row |
| 📆 Change month | Use the Year/Month selectors at the top |
| 😊 Log mood | Click a day cell in the Mood/Motivation rows (cycles 1–10) |
| ⬇️ Export | Click **⬇ Export** to download JSON backup |
| ⬆️ Import | Click **⬆ Import** to load a JSON file |

---

## 🔄 Monthly Auto-Refresh

Each month automatically starts fresh:
- When a new month begins, checkboxes are blank — no manual reset needed
- Previous months' data is preserved and can be viewed by switching the month selector
- Your habits list carries over — only the check data resets

---

## 🎨 Customization

Edit the CSS variables and arrays directly in `index.html`:

- **Colors/theme** — modify the CSS styles at the top
- **Default habits** — edit the `data.habits` array in `init()`
- **Emoji options** — edit the `EMOJIS` array
- **Mood scale** — currently 1–10, adjustable in `cycleMood()`

---

## 📄 License

MIT — use it however you want.
