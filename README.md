# ⚔️ Lords Mobile Screenshot Comparison Tool

A **100% offline** web application for comparing Lords Mobile guild screenshots and tracking player progress. No backend, no cloud storage, no internet required after initial load.

## 🎯 Features

### Core Functionality
- **📸 Screenshot Upload**: Drag-and-drop or click to upload multiple Lords Mobile guild screenshots
- **🔍 Local OCR**: Tesseract.js runs OCR directly in your browser to extract player data
- **📊 Automatic Comparison**: Compare two screenshots to see:
  - Might gained/lost per player
  - Kill increases
  - New players joined
  - Players who left
  - Rank changes
- **💾 Offline Storage**: All data stored locally using IndexedDB (no cloud uploads)
- **📥 CSV Export**: Export extractions and comparisons to CSV files
- **✏️ Manual Correction**: Edit OCR results if text recognition isn't perfect
- **📜 History**: Save and view previous extractions and comparisons

### Visual Features
- **Color-Coded Changes**: Green for increases, red for decreases
- **Confidence Scores**: See OCR confidence for each extracted value
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Summary Statistics**: Quick overview of guild growth metrics
- **Drag-and-Drop**: Easy image upload with visual feedback

## 🚀 Quick Start

### Option 1: Run Locally (Recommended)
1. Download all files (`index.html`, `style.css`, `script.js`)
2. Open `index.html` in any modern web browser
3. That's it! The app works completely offline

### Option 2: Use from GitHub Pages
Visit: `https://[your-username].github.io/lords-mobile-comparison/`

### Option 3: Run with Python (Simple Server)
```bash
# Navigate to the project folder
cd lords-mobile-comparison

# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Option 4: Run with Node.js
```bash
# Install a simple server
npm install -g http-server

# Run it
http-server

# Then open: http://localhost:8080
```

## 📖 How to Use

### Step 1: Upload Screenshots
1. Click the **"Select Images"** button or drag-and-drop screenshots
2. The app will automatically extract player data using OCR
3. You'll see a progress bar as it processes each image

### Step 2: Review Extracted Data
1. Select a screenshot from the dropdown
2. Review the extracted player list with:
   - Rank
   - Player Name
   - Might
   - Kills
   - Deaths
   - OCR Confidence Score

### Step 3: Correct OCR Errors (if needed)
1. Click the **"✏️ Edit"** button next to any player
2. Correct the player name, might, kills, or deaths
3. Click **"Save"** to update

### Step 4: Compare Screenshots
1. Go to the **"📊 Compare"** tab
2. Select two different screenshots
3. Click **"🔍 Compare"**
4. View the results:
   - Summary statistics
   - Individual player changes
   - New players joined
   - Players who left

### Step 5: Export Results
1. Click **"📥 Export to CSV"** to download comparison data
2. Open in Excel, Google Sheets, or any spreadsheet app
3. Share with your guild

### Step 6: Save for Later
1. Click **"💾 Save This Extraction"** or **"💾 Save Comparison"**
2. Access saved data in the **"📜 History"** tab
3. View or delete previous comparisons anytime

## 💾 Data Storage

### Where is my data stored?
- **Local Storage**: Player names, settings
- **IndexedDB**: Screenshot data, comparisons, player lists
- **Browser Cache**: Images for quick access

### How much data can I store?
- Typically **50-100 MB** depending on your browser
- Each screenshot with OCR data takes ~1-5 MB
- You can store 10-50 comparisons comfortably

### Is my data safe?
✅ **Yes!** All data stays on your device:
- No data sent to any server
- No cloud storage
- No tracking
- No analytics
- Completely private

### Can I backup my data?
Yes! Export comparisons to CSV:
1. Go to **"📊 Compare"** tab
2. Click **"📥 Export Comparison"**
3. Save the CSV file to your computer

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Responsive design with flexbox/grid
- **JavaScript (ES6+)**: Modern async/await
- **Tesseract.js**: Local OCR engine
- **IndexedDB**: Browser database
- **No backend**: 100% client-side

### Browser Compatibility
- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 47+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### File Structure
```
lords-mobile-comparison/
├── index.html          # Main HTML file with UI structure
├── style.css           # Complete styling (responsive design)
├── script.js           # All JavaScript functionality
└── README.md           # This file
```

### Key JavaScript Functions

#### OCR & Parsing
- `processFiles()`: Handle file upload and OCR
- `parsePlayerData()`: Extract player info from OCR text
- `parsePlayerDataAlternative()`: Fallback parsing method

#### Data Management
- `saveExtraction()`: Save screenshot data to IndexedDB
- `saveComparison()`: Save comparison results
- `loadHistory()`: Load saved data from database

#### Comparison Logic
- `compareScreenshots()`: Calculate differences between two screenshots
- `displayComparisonResults()`: Show comparison in UI

#### Export
- `exportToCSV()`: Export extraction to CSV
- `exportComparisonToCSV()`: Export comparison to CSV
- `downloadCSV()`: Handle CSV file download

#### UI Management
- `switchTab()`: Handle tab navigation
- `displayScreenshotData()`: Show player table
- `editPlayer()`: Open correction modal
- `saveCorrection()`: Save manual edits

## 🎨 UI Components

### Tabs
- **📸 Upload & Extract**: Upload screenshots and view extracted data
- **📊 Compare**: Compare two screenshots side-by-side
- **📜 History**: View and manage saved extractions/comparisons
- **⚙️ Settings**: App settings and information

### Key UI Elements
- **Drag-and-Drop Area**: Upload screenshots easily
- **Player Table**: Display extracted player data
- **Comparison Table**: Show player changes
- **Summary Cards**: Display key metrics
- **Modal Dialogs**: For editing player data
- **Toast Notifications**: Feedback messages

## 🐛 Troubleshooting

### OCR Not Working
- **Problem**: Text extraction is inaccurate
- **Solution**: 
  - Try clearer screenshots
  - Use manual correction to fix errors
  - Ensure good lighting in screenshots

### Storage Full
- **Problem**: "Storage quota exceeded" error
- **Solution**:
  - Clear old comparisons in History tab
  - Use "Clear All Data" in Settings
  - Export to CSV before clearing

### Slow Performance
- **Problem**: App is slow or laggy
- **Solution**:
  - Close other browser tabs
  - Clear browser cache
  - Use a modern browser (Chrome/Firefox)
  - Reduce number of screenshots processed at once

### Screenshots Not Uploading
- **Problem**: File upload fails
- **Solution**:
  - Check file size (should be < 10 MB)
  - Ensure it's a valid image format (JPG, PNG, etc.)
  - Try a different browser
  - Check browser console for errors (F12)

## 📝 Tips & Best Practices

### For Best OCR Results
1. **Clear Screenshots**: Use high-quality, clear screenshots
2. **Good Lighting**: Ensure text is readable
3. **Full Screen**: Include the entire player list
4. **Consistent Format**: Use same screenshot resolution
5. **Manual Correction**: Fix OCR errors immediately

### For Accurate Comparisons
1. **Same Time Intervals**: Compare screenshots taken at similar times
2. **Complete Lists**: Ensure all players are visible in both screenshots
3. **Consistent Sorting**: Screenshots should be sorted the same way
4. **Save Regularly**: Save important comparisons to history

### For Data Management
1. **Regular Backups**: Export comparisons to CSV regularly
2. **Organize History**: Delete old comparisons you don't need
3. **Use Meaningful Names**: Rename screenshots with dates
4. **Document Changes**: Add notes about guild events

## 🔐 Privacy & Security

- ✅ **No Data Collection**: We don't collect any data
- ✅ **No Tracking**: No analytics or tracking cookies
- ✅ **No Ads**: Completely ad-free
- ✅ **No Login**: No accounts or authentication
- ✅ **Open Source**: Code is transparent and auditable
- ✅ **Local Processing**: Everything runs on your device

## 🚀 Advanced Features

### Keyboard Shortcuts
- `Tab`: Navigate between fields
- `Enter`: Submit forms
- `Esc`: Close modals

### Settings
- **Auto-correct OCR**: Automatically fix common OCR errors
- **Show Confidence**: Display OCR confidence scores
- **Storage Info**: View how much storage you're using

### Batch Processing
- Upload multiple screenshots at once
- Process them in parallel
- View results in dropdown selector

## 📱 Mobile Usage

The app is fully responsive:
- **Portrait Mode**: Optimized table layout
- **Landscape Mode**: Full-width tables
- **Touch Friendly**: Large buttons and inputs
- **Offline Sync**: Works on mobile data or WiFi

## 🤝 Contributing

Found a bug? Have a feature request?
- Check the code in `script.js` for implementation details
- Review `style.css` for design customization
- Modify `index.html` to add new features

## 📄 License

This project is provided as-is for personal use. Feel free to modify and distribute.

## 🙋 FAQ

**Q: Does this work offline?**
A: Yes! After opening the HTML file, everything works offline. No internet needed.

**Q: Where is my data stored?**
A: All data is stored locally in your browser using IndexedDB. Nothing is sent to any server.

**Q: Can I use this on mobile?**
A: Yes! The app is fully responsive and works on all modern mobile browsers.

**Q: How accurate is the OCR?**
A: Accuracy depends on screenshot quality. Typically 85-95% for clear screenshots. You can manually correct errors.

**Q: Can I export my data?**
A: Yes! Export to CSV format which opens in Excel, Google Sheets, or any spreadsheet app.

**Q: What if I lose my data?**
A: Data is stored locally. If you clear browser data, it's lost. Always export important comparisons to CSV.

**Q: Can multiple people use this?**
A: Yes! Each person can use their own browser. Data doesn't sync between devices.

**Q: Is there a mobile app?**
A: Not yet, but the web app works great on mobile browsers.

**Q: Can I customize the app?**
A: Yes! Edit `style.css` for colors/design, `index.html` for layout, `script.js` for functionality.

## 🎓 Learning Resources

### Understanding the Code
1. **index.html**: Structure and UI elements
2. **style.css**: Styling and responsive design
3. **script.js**: Logic and functionality

### Key Concepts
- **OCR (Optical Character Recognition)**: Tesseract.js extracts text from images
- **IndexedDB**: Browser database for storing data
- **CSV Format**: Spreadsheet-compatible text format
- **Responsive Design**: CSS media queries for different screen sizes

## 🔄 Version History

### v1.0 (Initial Release)
- ✅ Screenshot upload with OCR
- ✅ Player data extraction
- ✅ Comparison functionality
- ✅ CSV export
- ✅ Local storage with IndexedDB
- ✅ Manual correction
- ✅ History management
- ✅ Responsive design
- ✅ 100% offline

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the FAQ
3. Check browser console (F12) for error messages
4. Try a different browser
5. Clear browser cache and try again

---

**Made with ❤️ for Lords Mobile players**

Enjoy tracking your guild's progress! 🎮⚔️

## Google Sheets control

The homepage price list and Player EXP Calculator read the public CSV export of the linked Google Sheet on page load. Keep the first sheet in three columns: `key`, `value`, and `what it controls`.

Existing price keys include `res_44444_90_price`, `res_44444_40_price`, `res_44444_20_price`, `res_44442_price`, `res_44440_price`, `res_40000_price`, `res_22222_price`, `res_22221_price`, `res_11111_price`, `bank_c1_1m`, `bank_c1_3m`, `bank_c1_6m`, `bank_c1_12m`, `bank_c2_1m`, `bank_c2_3m`, `bank_c2_6m`, `bank_c2_12m`, `leader_attack_price`, `customer_attack_price`, `t1_tier1_price`, and `t1_tier2_price`.

To control the Player EXP Calculator, add rows using these keys: `player_exp_1` through `player_exp_60`, `player_might_1` through `player_might_60`, `player_talent_1` through `player_talent_60`, `monster_exp_1` through `monster_exp_5`, and `troop_exp_1` through `troop_exp_5`. Missing values continue using the built-in defaults.
