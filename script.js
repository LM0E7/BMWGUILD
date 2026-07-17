/**
 * Lords Mobile Screenshot Comparison Tool
 * Complete JavaScript Implementation
 * 
 * Features:
 * - Local OCR using Tesseract.js
 * - IndexedDB for offline storage
 * - Player data extraction and comparison
 * - CSV export functionality
 * - Responsive UI with drag-and-drop
 * 
 * No backend, no cloud, completely offline
 */

// ============================================
// DATABASE INITIALIZATION
// ============================================

// Initialize IndexedDB for local storage
let db;
const DB_NAME = 'LordsMobileDB';
const STORE_EXTRACTIONS = 'extractions';
const STORE_COMPARISONS = 'comparisons';

/**
 * Initialize IndexedDB database
 */
function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create extractions store
            if (!database.objectStoreNames.contains(STORE_EXTRACTIONS)) {
                const extractionStore = database.createObjectStore(STORE_EXTRACTIONS, { keyPath: 'id', autoIncrement: true });
                extractionStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Create comparisons store
            if (!database.objectStoreNames.contains(STORE_COMPARISONS)) {
                const comparisonStore = database.createObjectStore(STORE_COMPARISONS, { keyPath: 'id', autoIncrement: true });
                comparisonStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// ============================================
// GLOBAL STATE MANAGEMENT
// ============================================

// Store extracted data from screenshots
let extractedScreenshots = {};
let currentScreenshotId = null;
let currentComparisonData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize database
        await initializeDB();
        showToast('Database initialized', 'success');

        // Setup event listeners
        setupEventListeners();

        // Load history
        loadHistory();

        // Update storage info
        updateStorageInfo();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error initializing app: ' + error.message, 'error');
    }
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================

/**
 * Setup all event listeners for the application
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // File input
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Screenshot selector
    document.getElementById('screenshotSelect').addEventListener('change', displayScreenshotData);

    // Compare selectors
    document.getElementById('compareScreenshot1').addEventListener('change', updateCompareOptions);
    document.getElementById('compareScreenshot2').addEventListener('change', updateCompareOptions);
}

// ============================================
// TAB MANAGEMENT
// ============================================

/**
 * Switch between tabs
 */
function switchTab(event) {
    const tabName = event.target.dataset.tab;

    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Load data if switching to compare or history
    if (tabName === 'compare') {
        loadCompareSelectorData();
    } else if (tabName === 'history') {
        loadHistory();
    }
}

// ============================================
// FILE HANDLING
// ============================================

/**
 * Handle drag over event
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadArea').classList.add('dragover');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
}

/**
 * Handle drop event
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');

    const files = event.dataTransfer.files;
    processFiles(files);
}

/**
 * Handle file selection from input
 */
function handleFileSelect(event) {
    const files = event.target.files;
    processFiles(files);
}

/**
 * Process selected files and extract data
 */
async function processFiles(files) {
    if (files.length === 0) {
        showToast('No files selected', 'warning');
        return;
    }

    // Show progress container
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'block';

    try {
        // Initialize Tesseract worker
        const { createWorker } = Tesseract;
        const worker = await createWorker('eng');

        let processedCount = 0;

        // Process each file
        for (const file of files) {
            try {
                // Read file as data URL
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const imageData = event.target.result;

                        // Run OCR
                        const result = await worker.recognize(imageData);
                        const text = result.data.text;
                        const confidence = result.data.confidence;

                        // Parse player data
                        const playerData = parsePlayerData(text, confidence);

                        // Generate unique ID for this screenshot
                        const screenshotId = 'screenshot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                        // Store screenshot data
                        extractedScreenshots[screenshotId] = {
                            id: screenshotId,
                            fileName: file.name,
                            timestamp: new Date().toLocaleString(),
                            rawText: text,
                            confidence: confidence,
                            players: playerData,
                            imageData: imageData
                        };

                        currentScreenshotId = screenshotId;
                        processedCount++;

                        // Update progress
                        const progress = Math.round((processedCount / files.length) * 100);
                        updateProgress(progress);

                        if (processedCount === files.length) {
                            // All files processed
                            await worker.terminate();
                            showExtractedData();
                            showToast('All screenshots processed successfully', 'success');
                            updateScreenshotSelector();
                        }
                    } catch (error) {
                        console.error('Error processing file:', error);
                        showToast('Error processing file: ' + file.name, 'error');
                    }
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error reading file:', error);
                showToast('Error reading file: ' + file.name, 'error');
            }
        }
    } catch (error) {
        console.error('Error initializing Tesseract:', error);
        showToast('Error initializing OCR: ' + error.message, 'error');
        document.getElementById('progressContainer').style.display = 'none';
    }
}

// ============================================
// OCR AND DATA PARSING
// ============================================

/**
 * Parse player data from OCR text
 * Extracts: Rank, Player Name, Might, Kills, Deaths
 */
function parsePlayerData(text, confidence) {
    const players = [];
    const lines = text.split('\n');

    let rank = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Try to parse rank (usually a number at the start)
        const rankMatch = line.match(/^(\d+)\s+/);
        if (rankMatch) {
            rank = parseInt(rankMatch[1]);

            // Extract player name and stats
            const remainingText = line.substring(rankMatch[0].length);

            // Try to extract numbers (Might, Kills, Deaths)
            const numbers = remainingText.match(/\d+/g) || [];

            // Extract player name (everything before the numbers)
            const nameMatch = remainingText.match(/^([a-zA-Z\s]+)/i);
            const playerName = nameMatch ? nameMatch[1].trim() : remainingText.substring(0, 20);

            if (playerName && playerName.length > 0) {
                const player = {
                    rank: rank,
                    name: playerName,
                    might: numbers[0] ? parseInt(numbers[0]) : 0,
                    kills: numbers[1] ? parseInt(numbers[1]) : 0,
                    deaths: numbers[2] ? parseInt(numbers[2]) : 0,
                    confidence: Math.round(confidence)
                };

                // Only add if we have a valid player name
                if (player.name.length > 1) {
                    players.push(player);
                }
            }
        }
    }

    // If no players found, try alternative parsing
    if (players.length === 0) {
        players.push(...parsePlayerDataAlternative(text));
    }

    return players;
}

/**
 * Alternative parsing method if standard parsing fails
 */
function parsePlayerDataAlternative(text) {
    const players = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0 && trimmedLine.length < 50) {
            const numbers = trimmedLine.match(/\d+/g) || [];
            if (numbers.length >= 1) {
                players.push({
                    rank: index + 1,
                    name: trimmedLine.replace(/\d+/g, '').trim() || 'Unknown',
                    might: numbers[0] ? parseInt(numbers[0]) : 0,
                    kills: numbers[1] ? parseInt(numbers[1]) : 0,
                    deaths: numbers[2] ? parseInt(numbers[2]) : 0,
                    confidence: 50
                });
            }
        }
    });

    return players;
}

// ============================================
// UI DISPLAY FUNCTIONS
// ============================================

/**
 * Show extracted data in the UI
 */
function showExtractedData() {
    const container = document.getElementById('extractedDataContainer');
    container.style.display = 'block';
    displayScreenshotData();
}

/**
 * Update screenshot selector dropdown
 */
function updateScreenshotSelector() {
    const select = document.getElementById('screenshotSelect');
    select.innerHTML = '<option value="">-- Choose a screenshot --</option>';

    Object.keys(extractedScreenshots).forEach(id => {
        const screenshot = extractedScreenshots[id];
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${screenshot.fileName} (${screenshot.timestamp})`;
        select.appendChild(option);
    });

    // Auto-select first screenshot
    if (Object.keys(extractedScreenshots).length > 0) {
        const firstId = Object.keys(extractedScreenshots)[0];
        select.value = firstId;
        currentScreenshotId = firstId;
        displayScreenshotData();
    }
}

/**
 * Display data for selected screenshot
 */
function displayScreenshotData() {
    const select = document.getElementById('screenshotSelect');
    const screenshotId = select.value;

    if (!screenshotId || !extractedScreenshots[screenshotId]) {
        document.getElementById('playerTableBody').innerHTML = '';
        return;
    }

    currentScreenshotId = screenshotId;
    const screenshot = extractedScreenshots[screenshotId];
    const tbody = document.getElementById('playerTableBody');
    tbody.innerHTML = '';

    screenshot.players.forEach((player, index) => {
        const row = document.createElement('tr');
        const confidenceColor = player.confidence > 80 ? 'green' : player.confidence > 60 ? 'orange' : 'red';

        row.innerHTML = `
            <td>${player.rank}</td>
            <td>${player.name}</td>
            <td>${player.might.toLocaleString()}</td>
            <td>${player.kills.toLocaleString()}</td>
            <td>${player.deaths.toLocaleString()}</td>
            <td><span style="color: ${confidenceColor}; font-weight: bold;">${player.confidence}%</span></td>
            <td>
                <button class="btn btn-secondary" onclick="editPlayer('${screenshotId}', ${index})">✏️ Edit</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Edit player data
 */
function editPlayer(screenshotId, playerIndex) {
    const screenshot = extractedScreenshots[screenshotId];
    const player = screenshot.players[playerIndex];

    document.getElementById('correctionName').value = player.name;
    document.getElementById('correctionMight').value = player.might;
    document.getElementById('correctionKills').value = player.kills;
    document.getElementById('correctionDeaths').value = player.deaths;

    // Store reference for saving
    window.currentEditingPlayer = { screenshotId, playerIndex };

    document.getElementById('correctionModal').style.display = 'block';
}

/**
 * Save player correction
 */
function saveCorrection() {
    if (!window.currentEditingPlayer) return;

    const { screenshotId, playerIndex } = window.currentEditingPlayer;
    const screenshot = extractedScreenshots[screenshotId];
    const player = screenshot.players[playerIndex];

    player.name = document.getElementById('correctionName').value;
    player.might = parseInt(document.getElementById('correctionMight').value) || 0;
    player.kills = parseInt(document.getElementById('correctionKills').value) || 0;
    player.deaths = parseInt(document.getElementById('correctionDeaths').value) || 0;

    closeCorrectionModal();
    displayScreenshotData();
    showToast('Player data updated', 'success');
}

/**
 * Close correction modal
 */
function closeCorrectionModal() {
    document.getElementById('correctionModal').style.display = 'none';
    window.currentEditingPlayer = null;
}

// ============================================
// COMPARISON LOGIC
// ============================================

/**
 * Load data into compare selectors
 */
function loadCompareSelectorData() {
    const select1 = document.getElementById('compareScreenshot1');
    const select2 = document.getElementById('compareScreenshot2');

    select1.innerHTML = '<option value="">-- Select first screenshot --</option>';
    select2.innerHTML = '<option value="">-- Select second screenshot --</option>';

    Object.keys(extractedScreenshots).forEach(id => {
        const screenshot = extractedScreenshots[id];

        const option1 = document.createElement('option');
        option1.value = id;
        option1.textContent = `${screenshot.fileName} (${screenshot.timestamp})`;
        select1.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = id;
        option2.textContent = `${screenshot.fileName} (${screenshot.timestamp})`;
        select2.appendChild(option2);
    });
}

/**
 * Update compare options (prevent selecting same screenshot)
 */
function updateCompareOptions() {
    const select1 = document.getElementById('compareScreenshot1').value;
    const select2 = document.getElementById('compareScreenshot2').value;

    if (select1 && select2 && select1 === select2) {
        showToast('Please select different screenshots', 'warning');
        document.getElementById('compareScreenshot2').value = '';
    }
}

/**
 * Perform comparison between two screenshots
 */
function performComparison() {
    const screenshot1Id = document.getElementById('compareScreenshot1').value;
    const screenshot2Id = document.getElementById('compareScreenshot2').value;

    if (!screenshot1Id || !screenshot2Id) {
        showToast('Please select two screenshots', 'warning');
        return;
    }

    if (screenshot1Id === screenshot2Id) {
        showToast('Please select different screenshots', 'warning');
        return;
    }

    const screenshot1 = extractedScreenshots[screenshot1Id];
    const screenshot2 = extractedScreenshots[screenshot2Id];

    // Perform comparison
    const comparison = compareScreenshots(screenshot1, screenshot2);
    currentComparisonData = comparison;

    // Display results
    displayComparisonResults(comparison);
}

/**
 * Compare two screenshots and calculate changes
 */
function compareScreenshots(screenshot1, screenshot2) {
    const players1 = screenshot1.players;
    const players2 = screenshot2.players;

    const comparison = {
        screenshot1: screenshot1.fileName,
        screenshot2: screenshot2.fileName,
        timestamp: new Date().toLocaleString(),
        playerChanges: [],
        newPlayers: [],
        playersLeft: [],
        totalMightChange: 0,
        totalKillsChange: 0
    };

    // Create maps for quick lookup
    const map1 = {};
    const map2 = {};

    players1.forEach(p => {
        map1[p.name.toLowerCase()] = p;
    });

    players2.forEach(p => {
        map2[p.name.toLowerCase()] = p;
    });

    // Find players in both screenshots and calculate changes
    Object.keys(map2).forEach(playerName => {
        const player2 = map2[playerName];

        if (map1[playerName]) {
            const player1 = map1[playerName];
            const mightChange = player2.might - player1.might;
            const killsChange = player2.kills - player1.kills;
            const rankChange = player2.rank - player1.rank;

            comparison.playerChanges.push({
                name: playerName,
                rank1: player1.rank,
                rank2: player2.rank,
                rankChange: rankChange,
                might1: player1.might,
                might2: player2.might,
                mightChange: mightChange,
                kills1: player1.kills,
                kills2: player2.kills,
                killsChange: killsChange,
                status: 'existing'
            });

            comparison.totalMightChange += mightChange;
            comparison.totalKillsChange += killsChange;
        } else {
            // New player
            comparison.newPlayers.push(player2);
        }
    });

    // Find players who left
    Object.keys(map1).forEach(playerName => {
        if (!map2[playerName]) {
            comparison.playersLeft.push(map1[playerName]);
        }
    });

    return comparison;
}

/**
 * Display comparison results in the UI
 */
function displayComparisonResults(comparison) {
    // Show results container
    document.getElementById('comparisonResults').style.display = 'block';

    // Update summary stats
    document.getElementById('totalMightChange').textContent = comparison.totalMightChange.toLocaleString();
    document.getElementById('totalMightChange').className = 'stat-value ' + 
        (comparison.totalMightChange > 0 ? 'positive' : comparison.totalMightChange < 0 ? 'negative' : '');

    document.getElementById('totalKillsChange').textContent = comparison.totalKillsChange.toLocaleString();
    document.getElementById('totalKillsChange').className = 'stat-value ' + 
        (comparison.totalKillsChange > 0 ? 'positive' : comparison.totalKillsChange < 0 ? 'negative' : '');

    document.getElementById('newPlayersCount').textContent = comparison.newPlayers.length;
    document.getElementById('playersLeftCount').textContent = comparison.playersLeft.length;

    // Display player changes
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    comparison.playerChanges.forEach(change => {
        const row = document.createElement('tr');
        const mightChangeClass = change.mightChange > 0 ? 'change-positive' : change.mightChange < 0 ? 'change-negative' : 'change-neutral';
        const killsChangeClass = change.killsChange > 0 ? 'change-positive' : change.killsChange < 0 ? 'change-negative' : 'change-neutral';

        row.innerHTML = `
            <td><strong>${change.name}</strong></td>
            <td>${change.rank1} → ${change.rank2}</td>
            <td class="${mightChangeClass}">${change.mightChange > 0 ? '+' : ''}${change.mightChange.toLocaleString()}</td>
            <td class="${killsChangeClass}">${change.killsChange > 0 ? '+' : ''}${change.killsChange.toLocaleString()}</td>
            <td><span class="badge badge-unchanged">Existing</span></td>
        `;

        tbody.appendChild(row);
    });

    // Display new players
    if (comparison.newPlayers.length > 0) {
        document.getElementById('newPlayersSection').style.display = 'block';
        const newPlayersBody = document.getElementById('newPlayersBody');
        newPlayersBody.innerHTML = '';

        comparison.newPlayers.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.rank}</td>
                <td><strong>${player.name}</strong></td>
                <td>${player.might.toLocaleString()}</td>
                <td>${player.kills.toLocaleString()}</td>
            `;
            newPlayersBody.appendChild(row);
        });
    } else {
        document.getElementById('newPlayersSection').style.display = 'none';
    }

    // Display players left
    if (comparison.playersLeft.length > 0) {
        document.getElementById('playersLeftSection').style.display = 'block';
        const playersLeftBody = document.getElementById('playersLeftBody');
        playersLeftBody.innerHTML = '';

        comparison.playersLeft.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.rank}</td>
                <td><strong>${player.name}</strong></td>
                <td>${player.might.toLocaleString()}</td>
                <td>${player.kills.toLocaleString()}</td>
            `;
            playersLeftBody.appendChild(row);
        });
    } else {
        document.getElementById('playersLeftSection').style.display = 'none';
    }

    // Scroll to results
    document.getElementById('comparisonResults').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export current screenshot data to CSV
 */
function exportToCSV() {
    if (!currentScreenshotId || !extractedScreenshots[currentScreenshotId]) {
        showToast('No screenshot selected', 'warning');
        return;
    }

    const screenshot = extractedScreenshots[currentScreenshotId];
    const csv = convertPlayersToCSV(screenshot.players, screenshot.fileName);
    downloadCSV(csv, `extraction_${Date.now()}.csv`);
    showToast('Extraction exported to CSV', 'success');
}

/**
 * Export comparison results to CSV
 */
function exportComparisonToCSV() {
    if (!currentComparisonData) {
        showToast('No comparison data to export', 'warning');
        return;
    }

    const comparison = currentComparisonData;
    let csv = 'Player Comparison Report\n';
    csv += `From: ${comparison.screenshot1}\n`;
    csv += `To: ${comparison.screenshot2}\n`;
    csv += `Generated: ${comparison.timestamp}\n\n`;

    csv += 'Summary\n';
    csv += `Total Might Change,${comparison.totalMightChange}\n`;
    csv += `Total Kills Change,${comparison.totalKillsChange}\n`;
    csv += `New Players,${comparison.newPlayers.length}\n`;
    csv += `Players Left,${comparison.playersLeft.length}\n\n`;

    csv += 'Player Changes\n';
    csv += 'Player Name,Rank Change,Might Change,Kills Change,Status\n';
    comparison.playerChanges.forEach(change => {
        csv += `"${change.name}",${change.rank1}→${change.rank2},${change.mightChange},${change.killsChange},Existing\n`;
    });

    csv += '\nNew Players\n';
    csv += 'Rank,Player Name,Might,Kills\n';
    comparison.newPlayers.forEach(player => {
        csv += `${player.rank},"${player.name}",${player.might},${player.kills}\n`;
    });

    csv += '\nPlayers Left\n';
    csv += 'Rank,Player Name,Might,Kills\n';
    comparison.playersLeft.forEach(player => {
        csv += `${player.rank},"${player.name}",${player.might},${player.kills}\n`;
    });

    downloadCSV(csv, `comparison_${Date.now()}.csv`);
    showToast('Comparison exported to CSV', 'success');
}

/**
 * Convert player data to CSV format
 */
function convertPlayersToCSV(players, fileName) {
    let csv = `Screenshot: ${fileName}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Rank,Player Name,Might,Kills,Deaths,Confidence\n';

    players.forEach(player => {
        csv += `${player.rank},"${player.name}",${player.might},${player.kills},${player.deaths},${player.confidence}%\n`;
    });

    return csv;
}

/**
 * Download CSV file
 */
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Save current extraction to IndexedDB
 */
function saveExtraction() {
    if (!currentScreenshotId || !extractedScreenshots[currentScreenshotId]) {
        showToast('No screenshot to save', 'warning');
        return;
    }

    const screenshot = extractedScreenshots[currentScreenshotId];
    const transaction = db.transaction([STORE_EXTRACTIONS], 'readwrite');
    const store = transaction.objectStore(STORE_EXTRACTIONS);

    const data = {
        fileName: screenshot.fileName,
        timestamp: screenshot.timestamp,
        players: screenshot.players,
        rawText: screenshot.rawText,
        confidence: screenshot.confidence
    };

    const request = store.add(data);

    request.onerror = () => {
        showToast('Error saving extraction', 'error');
    };

    request.onsuccess = () => {
        showToast('Extraction saved successfully', 'success');
        loadHistory();
    };
}

/**
 * Save comparison to IndexedDB
 */
function saveComparison() {
    if (!currentComparisonData) {
        showToast('No comparison to save', 'warning');
        return;
    }

    const transaction = db.transaction([STORE_COMPARISONS], 'readwrite');
    const store = transaction.objectStore(STORE_COMPARISONS);

    const request = store.add(currentComparisonData);

    request.onerror = () => {
        showToast('Error saving comparison', 'error');
    };

    request.onsuccess = () => {
        showToast('Comparison saved successfully', 'success');
        loadHistory();
    };
}

/**
 * Load history from IndexedDB
 */
function loadHistory() {
    const transaction = db.transaction([STORE_EXTRACTIONS, STORE_COMPARISONS], 'readonly');
    const extractionStore = transaction.objectStore(STORE_EXTRACTIONS);
    const comparisonStore = transaction.objectStore(STORE_COMPARISONS);

    const allExtractions = [];
    const allComparisons = [];

    extractionStore.getAll().onsuccess = (event) => {
        allExtractions.push(...event.target.result);
        displayHistory(allExtractions, allComparisons);
    };

    comparisonStore.getAll().onsuccess = (event) => {
        allComparisons.push(...event.target.result);
        displayHistory(allExtractions, allComparisons);
    };
}

/**
 * Display history in the UI
 */
function displayHistory(extractions, comparisons) {
    const container = document.getElementById('historyContainer');

    if (extractions.length === 0 && comparisons.length === 0) {
        container.innerHTML = '<p class="empty-state">No saved data yet.</p>';
        return;
    }

    container.innerHTML = '';

    // Display extractions
    extractions.forEach((extraction, index) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-card-title">📸 ${extraction.fileName}</div>
            <div class="history-card-info">Players: ${extraction.players.length}</div>
            <div class="history-card-info">Saved: ${extraction.timestamp}</div>
            <div class="history-card-actions">
                <button class="btn btn-info" onclick="viewExtraction(${index})">View</button>
                <button class="btn btn-danger" onclick="deleteExtraction(${index})">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Display comparisons
    comparisons.forEach((comparison, index) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-card-title">📊 Comparison</div>
            <div class="history-card-info">From: ${comparison.screenshot1}</div>
            <div class="history-card-info">To: ${comparison.screenshot2}</div>
            <div class="history-card-info">Might Change: <span class="${comparison.totalMightChange > 0 ? 'change-positive' : 'change-negative'}">${comparison.totalMightChange > 0 ? '+' : ''}${comparison.totalMightChange}</span></div>
            <div class="history-card-actions">
                <button class="btn btn-info" onclick="viewComparison(${index})">View</button>
                <button class="btn btn-danger" onclick="deleteComparison(${index})">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Delete extraction from history
 */
function deleteExtraction(index) {
    if (confirm('Are you sure you want to delete this extraction?')) {
        const transaction = db.transaction([STORE_EXTRACTIONS], 'readwrite');
        const store = transaction.objectStore(STORE_EXTRACTIONS);
        store.delete(index + 1);

        transaction.oncomplete = () => {
            showToast('Extraction deleted', 'success');
            loadHistory();
        };
    }
}

/**
 * Delete comparison from history
 */
function deleteComparison(index) {
    if (confirm('Are you sure you want to delete this comparison?')) {
        const transaction = db.transaction([STORE_COMPARISONS], 'readwrite');
        const store = transaction.objectStore(STORE_COMPARISONS);
        store.delete(index + 1);

        transaction.oncomplete = () => {
            showToast('Comparison deleted', 'success');
            loadHistory();
        };
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Update progress bar
 */
function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    progressFill.style.width = percent + '%';
    progressFill.textContent = percent + '%';
    progressText.textContent = `Processing: ${percent}%`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Clear all data
 */
function clearAll() {
    if (confirm('Are you sure you want to clear all extracted data?')) {
        extractedScreenshots = {};
        currentScreenshotId = null;
        document.getElementById('extractedDataContainer').style.display = 'none';
        document.getElementById('progressContainer').style.display = 'none';
        document.getElementById('playerTableBody').innerHTML = '';
        document.getElementById('fileInput').value = '';
        showToast('All data cleared', 'success');
    }
}

/**
 * Clear all data from database
 */
function clearAllData() {
    if (confirm('Are you sure you want to permanently delete ALL saved data? This cannot be undone.')) {
        const transaction = db.transaction([STORE_EXTRACTIONS, STORE_COMPARISONS], 'readwrite');

        transaction.objectStore(STORE_EXTRACTIONS).clear();
        transaction.objectStore(STORE_COMPARISONS).clear();

        transaction.oncomplete = () => {
            extractedScreenshots = {};
            currentScreenshotId = null;
            currentComparisonData = null;
            showToast('All data deleted', 'success');
            loadHistory();
        };
    }
}

/**
 * Update storage information
 */
function updateStorageInfo() {
    // Estimate storage usage (rough calculation)
    let totalSize = 0;

    Object.values(extractedScreenshots).forEach(screenshot => {
        totalSize += JSON.stringify(screenshot).length;
    });

    const storageMB = (totalSize / (1024 * 1024)).toFixed(2);
    document.getElementById('storageUsed').textContent = storageMB;
}

/**
 * View extraction details
 */
function viewExtraction(index) {
    showToast('View extraction feature coming soon', 'info');
}

/**
 * View comparison details
 */
function viewComparison(index) {
    showToast('View comparison feature coming soon', 'info');
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('correctionModal');
    if (event.target === modal) {
        closeCorrectionModal();
    }
});

// Prevent default drag behavior on document
document.addEventListener('dragover', (event) => {
    event.preventDefault();
});

document.addEventListener('drop', (event) => {
    event.preventDefault();
});
