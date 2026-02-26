// RINGwars 3D - UI Components

import { GameState, Move, PlayerState } from './types';
import { getVisibleNodes } from './gameLogic';

export interface GameUI {
  container: HTMLElement;
  updateState: (state: GameState) => void;
  onMoveSubmit: (callback: (moves: Move[]) => void) => void;
  showMessage: (msg: string, type?: 'info' | 'success' | 'error') => void;
  setPlayerMode: (mode: 'human' | 'ai', player: 'red' | 'blue') => void;
  onStart: (callback: () => void) => void;
  onStep: (callback: () => void) => void;
  onAutoPlay: (callback: () => void) => void;
  onReset: (callback: () => void) => void;
  setButtonText: (button: 'start' | 'auto', text: string) => void;
  getSelectedAgents: () => { red: string; blue: string };
  getGameSettings: () => { turnLimit: number; suddenDeathTurn: number; suddenDeathDecay: number };
  refreshAgents: () => Promise<void>;
}

export function createGameUI(container: HTMLElement): GameUI {
  // Create UI structure
  const uiContainer = document.createElement('div');
  uiContainer.id = 'ringwars-ui';
  uiContainer.innerHTML = `
    <div class="rw-header">
      <h1>RINGwars 3D</h1>
      <div class="rw-step">Step: <span id="step-num">0</span> / <span id="turn-limit">500</span></div>
      <div class="rw-sudden-death" id="sudden-death-info" style="display: none;">
        <span class="rw-sudden-death-label">SUDDEN DEATH</span>
        <span>Max: <span id="current-max">10000</span></span>
      </div>
    </div>

    <div class="rw-players">
      <div class="rw-player rw-red">
        <div class="rw-player-name">🔴 <span id="red-name">Red Agent</span></div>
        <div class="rw-player-stats">
          <div>Fernies: <span id="red-fernies">0</span></div>
          <div>Nodes: <span id="red-nodes">0</span></div>
          <div>New: <span id="red-new">0</span></div>
        </div>
      </div>
      <div class="rw-player rw-blue">
        <div class="rw-player-name">🔵 <span id="blue-name">Blue Agent</span></div>
        <div class="rw-player-stats">
          <div>Fernies: <span id="blue-fernies">0</span></div>
          <div>Nodes: <span id="blue-nodes">0</span></div>
          <div>New: <span id="blue-new">0</span></div>
        </div>
      </div>
    </div>

    <div class="rw-agents">
      <h3>Agents</h3>
      <div class="rw-agent-row">
        <label>Red:</label>
        <select id="red-agent">
          <option value="builtin">Built-in AI</option>
        </select>
      </div>
      <div class="rw-agent-row">
        <label>Blue:</label>
        <select id="blue-agent">
          <option value="builtin">Built-in AI</option>
        </select>
      </div>
      <div class="rw-agent-upload">
        <input type="file" id="agent-upload" accept=".jar,.py,.js,.mjs" style="display:none;">
        <button id="btn-upload-agent">Upload Agent</button>
        <button id="btn-refresh-agents">Refresh</button>
      </div>
      <div class="rw-server-status">
        Server: <span id="server-status">checking...</span>
      </div>
    </div>

    <div class="rw-controls">
      <div class="rw-move-input" id="move-input-section" style="display: none;">
        <h3>Your Move (Human Player)</h3>
        <textarea id="move-input" placeholder="Enter moves: nodeIndex,amount&#10;e.g., 5,20 (place 20 on node 5)&#10;     3,-10 (remove 10 from node 3)"></textarea>
        <button id="submit-move">Submit Move</button>
      </div>

      <div class="rw-actions">
        <button id="btn-start">Start Game</button>
        <button id="btn-step">Next Step</button>
        <button id="btn-auto">Auto Play</button>
        <button id="btn-reset">Reset</button>
      </div>

      <div class="rw-speed">
        <label>Speed: <input type="range" id="speed-slider" min="100" max="2000" value="500"></label>
        <span id="speed-value">500ms</span>
      </div>

      <div class="rw-game-settings">
        <h3>Game Settings</h3>
        <div class="rw-setting-row">
          <label>Turn Limit:</label>
          <input type="number" id="turn-limit-input" min="50" max="1000" value="200" step="50">
        </div>
        <div class="rw-setting-row">
          <label>Sudden Death:</label>
          <input type="number" id="sudden-death-input" min="20" max="500" value="100" step="10">
        </div>
        <div class="rw-setting-row">
          <label>Decay Rate:</label>
          <select id="decay-rate-input">
            <option value="0.05">5% (Slow)</option>
            <option value="0.10" selected>10% (Normal)</option>
            <option value="0.20">20% (Fast)</option>
            <option value="0.30">30% (Aggressive)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="rw-log">
      <h3>Battle Log</h3>
      <div id="battle-log"></div>
    </div>

    <div class="rw-message" id="message-area"></div>

    <div class="rw-winner" id="winner-overlay" style="display: none;">
      <div class="rw-winner-content">
        <h2 id="winner-text">Victory!</h2>
        <button id="btn-play-again">Play Again</button>
      </div>
    </div>
  `;
  container.appendChild(uiContainer);

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #ringwars-ui {
      position: fixed;
      top: 0;
      left: 0;
      width: 300px;
      height: 100%;
      background: rgba(20, 20, 40, 0.95);
      color: #fff;
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 15px;
      box-sizing: border-box;
      overflow-y: auto;
      z-index: 100;
    }

    .rw-header h1 {
      margin: 0 0 5px 0;
      font-size: 24px;
      background: linear-gradient(135deg, #e53935, #4285f4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .rw-step {
      font-size: 14px;
      color: #888;
    }

    .rw-sudden-death {
      margin-top: 8px;
      padding: 8px;
      background: rgba(255, 100, 100, 0.2);
      border: 1px solid #ff4444;
      border-radius: 6px;
      font-size: 12px;
      color: #ff6666;
    }

    .rw-sudden-death-label {
      font-weight: bold;
      color: #ff4444;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .rw-players {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 20px 0;
    }

    .rw-agents {
      margin: 15px 0;
      padding: 10px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
    }

    .rw-agents h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }

    .rw-agent-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .rw-agent-row label {
      width: 40px;
      font-size: 12px;
    }

    .rw-agent-row select {
      flex: 1;
      padding: 5px;
      border-radius: 4px;
      background: #2a2a4a;
      color: #fff;
      border: 1px solid #4a4a6a;
      font-size: 12px;
    }

    .rw-agent-upload {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .rw-agent-upload button {
      flex: 1;
      padding: 6px;
      border: none;
      border-radius: 4px;
      background: #3a3a5c;
      color: #fff;
      cursor: pointer;
      font-size: 11px;
    }

    .rw-agent-upload button:hover {
      background: #4a4a7c;
    }

    .rw-server-status {
      margin-top: 8px;
      font-size: 11px;
      color: #888;
    }

    .rw-server-status .online { color: #4caf50; }
    .rw-server-status .offline { color: #f44336; }

    .rw-player {
      padding: 10px;
      border-radius: 8px;
      border: 2px solid;
    }

    .rw-red {
      border-color: #e53935;
      background: rgba(229, 57, 53, 0.1);
    }

    .rw-blue {
      border-color: #4285f4;
      background: rgba(66, 133, 244, 0.1);
    }

    .rw-player-name {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .rw-player-stats {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #aaa;
    }

    .rw-controls {
      margin: 20px 0;
    }

    .rw-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 15px;
    }

    .rw-actions button, #submit-move {
      padding: 10px;
      border: none;
      border-radius: 6px;
      background: #3a3a5c;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }

    .rw-actions button:hover, #submit-move:hover {
      background: #4a4a7c;
    }

    #btn-start {
      background: #2e7d32;
    }

    #btn-start:hover {
      background: #388e3c;
    }

    .rw-speed {
      font-size: 12px;
      color: #888;
    }

    .rw-speed input {
      width: 100%;
      margin-top: 5px;
    }

    .rw-game-settings {
      margin-top: 15px;
      padding: 10px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
    }

    .rw-game-settings h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #aaa;
    }

    .rw-setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .rw-setting-row label {
      color: #888;
    }

    .rw-setting-row input[type="number"],
    .rw-setting-row select {
      width: 100px;
      padding: 5px;
      border-radius: 4px;
      background: #2a2a4a;
      color: #fff;
      border: 1px solid #4a4a6a;
      font-size: 12px;
    }

    .rw-move-input {
      margin-bottom: 15px;
    }

    .rw-move-input h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
    }

    #move-input {
      width: 100%;
      height: 80px;
      background: #2a2a4a;
      border: 1px solid #4a4a6a;
      border-radius: 6px;
      color: #fff;
      padding: 8px;
      font-family: monospace;
      font-size: 12px;
      resize: vertical;
      box-sizing: border-box;
    }

    #submit-move {
      width: 100%;
      margin-top: 8px;
      background: #1976d2;
    }

    #submit-move:hover {
      background: #1e88e5;
    }

    .rw-log {
      margin: 20px 0;
    }

    .rw-log h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }

    #battle-log {
      max-height: 150px;
      overflow-y: auto;
      font-size: 11px;
      color: #999;
      background: rgba(0,0,0,0.3);
      padding: 8px;
      border-radius: 6px;
    }

    .rw-log-entry {
      margin-bottom: 5px;
      padding-bottom: 5px;
      border-bottom: 1px solid #333;
    }

    .rw-message {
      position: fixed;
      bottom: 20px;
      left: 320px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      display: none;
      z-index: 200;
    }

    .rw-message.info {
      background: rgba(33, 150, 243, 0.9);
    }

    .rw-message.success {
      background: rgba(76, 175, 80, 0.9);
    }

    .rw-message.error {
      background: rgba(244, 67, 54, 0.9);
    }

    .rw-winner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 300;
    }

    .rw-winner-content {
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #1a1a2e, #2d2d44);
      border-radius: 20px;
      border: 3px solid #4a4a6a;
    }

    .rw-winner-content h2 {
      font-size: 48px;
      margin: 0 0 20px 0;
    }

    #btn-play-again {
      padding: 15px 40px;
      font-size: 18px;
      border: none;
      border-radius: 10px;
      background: #4285f4;
      color: #fff;
      cursor: pointer;
    }

    #btn-play-again:hover {
      background: #5a95ff;
    }
  `;
  document.head.appendChild(style);

  // Get DOM elements - use querySelector on uiContainer to avoid conflicts
  const $ = (sel: string) => uiContainer.querySelector(sel) as HTMLElement;
  const stepNum = $('#step-num')!;
  const turnLimit = $('#turn-limit')!;
  const suddenDeathInfo = $('#sudden-death-info')!;
  const currentMax = $('#current-max')!;
  const redFernies = $('#red-fernies')!;
  const redNodes = $('#red-nodes')!;
  const redNew = $('#red-new')!;
  const blueFernies = $('#blue-fernies')!;
  const blueNodes = $('#blue-nodes')!;
  const blueNew = $('#blue-new')!;
  const battleLog = $('#battle-log')!;
  const messageArea = $('#message-area')!;
  const winnerOverlay = $('#winner-overlay')!;
  const winnerText = $('#winner-text')!;
  const moveInputSection = $('#move-input-section')!;
  const moveInput = $('#move-input') as HTMLTextAreaElement;
  const speedSlider = $('#speed-slider') as HTMLInputElement;
  const speedValue = $('#speed-value')!;
  const redAgentSelect = $('#red-agent') as HTMLSelectElement;
  const blueAgentSelect = $('#blue-agent') as HTMLSelectElement;
  const agentUpload = $('#agent-upload') as HTMLInputElement;
  const btnUploadAgent = $('#btn-upload-agent') as HTMLButtonElement;
  const btnRefreshAgents = $('#btn-refresh-agents') as HTMLButtonElement;
  const serverStatus = $('#server-status')!;
  const turnLimitInput = $('#turn-limit-input') as HTMLInputElement;
  const suddenDeathInput = $('#sudden-death-input') as HTMLInputElement;
  const decayRateInput = $('#decay-rate-input') as HTMLSelectElement;

  const AGENT_SERVER = 'http://localhost:3001';

  console.log('UI Elements found:', { stepNum, redFernies, battleLog });

  speedSlider.addEventListener('input', () => {
    speedValue.textContent = `${speedSlider.value}ms`;
  });

  // Agent server functions
  async function checkServerStatus() {
    try {
      const res = await fetch(`${AGENT_SERVER}/health`);
      if (res.ok) {
        serverStatus.innerHTML = '<span class="online">Online</span>';
        return true;
      }
    } catch (e) {}
    serverStatus.innerHTML = '<span class="offline">Offline</span> (run: npm run agent-server)';
    return false;
  }

  async function refreshAgents() {
    const online = await checkServerStatus();
    if (!online) return;

    try {
      const res = await fetch(`${AGENT_SERVER}/agents`);
      const data = await res.json();

      // Update selects
      const options = '<option value="builtin">Built-in AI</option>' +
        data.agents.map((a: string) => `<option value="${a}">${a}</option>`).join('');

      const redVal = redAgentSelect.value;
      const blueVal = blueAgentSelect.value;
      redAgentSelect.innerHTML = options;
      blueAgentSelect.innerHTML = options;

      // Restore selection if still valid
      if (data.agents.includes(redVal) || redVal === 'builtin') redAgentSelect.value = redVal;
      if (data.agents.includes(blueVal) || blueVal === 'builtin') blueAgentSelect.value = blueVal;
    } catch (e) {
      console.error('Failed to fetch agents:', e);
    }
  }

  async function uploadAgent(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${AGENT_SERVER}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Uploaded: ${data.filename}`, 'success');
        await refreshAgents();
      } else {
        showMessage(`Upload failed: ${data.error}`, 'error');
      }
    } catch (e) {
      showMessage('Upload failed - is server running?', 'error');
    }
  }

  // Agent UI event handlers
  btnUploadAgent?.addEventListener('click', () => agentUpload?.click());
  agentUpload?.addEventListener('change', () => {
    if (agentUpload.files?.[0]) {
      uploadAgent(agentUpload.files[0]);
      agentUpload.value = '';
    }
  });
  btnRefreshAgents?.addEventListener('click', () => refreshAgents());

  // Initial check
  checkServerStatus();
  refreshAgents();

  let moveCallback: ((moves: Move[]) => void) | null = null;

  $('#submit-move')!.addEventListener('click', () => {
    if (moveCallback) {
      const moves: Move[] = [];
      const lines = moveInput.value.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/[,\s]+/);
        if (parts.length >= 2) {
          const nodeIndex = parseInt(parts[0], 10);
          const amount = parseInt(parts[1], 10);
          if (!isNaN(nodeIndex) && !isNaN(amount)) {
            moves.push({ nodeIndex, amount });
          }
        }
      }
      moveCallback(moves);
      moveInput.value = '';
    }
  });

  function updateState(state: GameState) {
    console.log('UI updateState called:', {
      step: state.step,
      redTotal: state.red.totalFernies,
      redNodes: state.red.nodesControlled,
      redNew: state.red.newFernies,
    });

    stepNum.textContent = state.step.toString();
    turnLimit.textContent = state.settings.turnLimit.toString();

    // Show sudden death status
    if (state.inSuddenDeath) {
      suddenDeathInfo.style.display = 'block';
      currentMax.textContent = state.currentMaxFernies.toString();
    } else {
      suddenDeathInfo.style.display = 'none';
    }

    redFernies.textContent = state.red.totalFernies.toString();
    redNodes.textContent = state.red.nodesControlled.toString();
    redNew.textContent = state.red.newFernies.toString();

    blueFernies.textContent = state.blue.totalFernies.toString();
    blueNodes.textContent = state.blue.nodesControlled.toString();
    blueNew.textContent = state.blue.newFernies.toString();

    // Update battle log
    if (state.battleLog.length > 0) {
      const logEntries = state.battleLog.map((b) => {
        const nodeStr = b.nodes.join(', ');
        return `<div class="rw-log-entry">
          <strong>${b.type.toUpperCase()}</strong> at nodes [${nodeStr}]<br>
          Winner: ${b.winner || 'Tie'} | Lost: R:${b.ferniesLost.red} B:${b.ferniesLost.blue}
        </div>`;
      });
      battleLog.innerHTML = logEntries.join('') + battleLog.innerHTML;
    }

    // Check for winner
    if (state.phase === 'gameover' && state.winner) {
      winnerOverlay.style.display = 'flex';
      if (state.winner === 'draw') {
        winnerText.textContent = '🤝 DRAW!';
        winnerText.style.color = '#888';
      } else if (state.winner === 'red') {
        winnerText.textContent = '🔴 RED WINS!';
        winnerText.style.color = '#e53935';
      } else {
        winnerText.textContent = '🔵 BLUE WINS!';
        winnerText.style.color = '#4285f4';
      }
    } else {
      winnerOverlay.style.display = 'none';
    }
  }

  function onMoveSubmit(callback: (moves: Move[]) => void) {
    moveCallback = callback;
  }

  function showMessage(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    messageArea.textContent = msg;
    messageArea.className = `rw-message ${type}`;
    messageArea.style.display = 'block';
    setTimeout(() => {
      messageArea.style.display = 'none';
    }, 3000);
  }

  function setPlayerMode(mode: 'human' | 'ai', player: 'red' | 'blue') {
    if (mode === 'human') {
      moveInputSection.style.display = 'block';
    } else {
      moveInputSection.style.display = 'none';
    }
  }

  // Button click handlers
  const btnStart = $('#btn-start') as HTMLButtonElement;
  const btnStep = $('#btn-step') as HTMLButtonElement;
  const btnAuto = $('#btn-auto') as HTMLButtonElement;
  const btnReset = $('#btn-reset') as HTMLButtonElement;
  const btnPlayAgain = $('#btn-play-again') as HTMLButtonElement;

  function onStart(callback: () => void) {
    btnStart?.addEventListener('click', () => {
      console.log('Start button clicked');
      callback();
    });
  }

  function onStep(callback: () => void) {
    btnStep?.addEventListener('click', () => {
      console.log('Step button clicked');
      callback();
    });
  }

  function onAutoPlay(callback: () => void) {
    btnAuto?.addEventListener('click', () => {
      console.log('Auto button clicked');
      callback();
    });
  }

  function onReset(callback: () => void) {
    btnReset?.addEventListener('click', () => {
      console.log('Reset button clicked');
      callback();
    });
    btnPlayAgain?.addEventListener('click', () => {
      console.log('Play again button clicked');
      callback();
    });
  }

  function setButtonText(button: 'start' | 'auto', text: string) {
    if (button === 'start' && btnStart) {
      btnStart.textContent = text;
    } else if (button === 'auto' && btnAuto) {
      btnAuto.textContent = text;
    }
  }

  function getSelectedAgents() {
    return {
      red: redAgentSelect?.value || 'builtin',
      blue: blueAgentSelect?.value || 'builtin',
    };
  }

  function getGameSettings() {
    return {
      turnLimit: parseInt(turnLimitInput?.value || '200', 10),
      suddenDeathTurn: parseInt(suddenDeathInput?.value || '100', 10),
      suddenDeathDecay: parseFloat(decayRateInput?.value || '0.10'),
    };
  }

  return {
    container: uiContainer,
    updateState,
    onMoveSubmit,
    showMessage,
    setPlayerMode,
    onStart,
    onStep,
    onAutoPlay,
    onReset,
    setButtonText,
    getSelectedAgents,
    getGameSettings,
    refreshAgents,
  };
}
