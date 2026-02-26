// RINGwars Agent Server - Executes JAR agents for the game
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3001;
const AGENTS_DIR = path.join(__dirname, 'agents');
const TEMP_DIR = path.join(__dirname, 'temp');
const SUPPORTED_EXTENSIONS = ['.jar', '.py', '.js', '.mjs'];

// Ensure directories exist
if (!fs.existsSync(AGENTS_DIR)) fs.mkdirSync(AGENTS_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Parse multipart form data (simple implementation)
function parseMultipart(buffer, boundary) {
  const parts = {};
  const boundaryBuffer = Buffer.from('--' + boundary);
  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;

  while (start < buffer.length) {
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;

    const part = buffer.slice(start, end - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    const headers = part.slice(0, headerEnd).toString();
    const content = part.slice(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        parts[name] = { filename: filenameMatch[1], data: content };
      } else {
        parts[name] = content.toString();
      }
    }

    start = end + boundaryBuffer.length + 2;
  }

  return parts;
}

// Get command and args based on file extension
function getExecutionCommand(agentPath) {
  const ext = path.extname(agentPath).toLowerCase();
  switch (ext) {
    case '.jar':
      return { cmd: 'java', args: ['-jar', agentPath] };
    case '.py':
      return { cmd: 'python3', args: [agentPath] };
    case '.js':
    case '.mjs':
      return { cmd: 'node', args: [agentPath] };
    default:
      return null;
  }
}

// Execute agent (supports JAR, Python, Node.js)
async function executeAgent(agentPath, stepFile, agentName, stepNum) {
  return new Promise((resolve, reject) => {
    const stepDir = path.dirname(stepFile);
    const moveFile = path.join(stepDir, `${agentName}.move`);

    const execution = getExecutionCommand(agentPath);
    if (!execution) {
      console.error(`Unsupported agent type: ${agentPath}`);
      resolve('');
      return;
    }

    const fullArgs = [...execution.args, stepNum.toString(), agentName];
    console.log(`Executing: ${execution.cmd} ${fullArgs.join(' ')}`);
    console.log(`Working dir: ${stepDir}`);

    const proc = spawn(execution.cmd, fullArgs, {
      cwd: stepDir,
      timeout: 5000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      console.log(`Agent ${agentName} exited with code ${code}`);
      if (stderr) console.log(`Stderr: ${stderr}`);

      // Read move file
      setTimeout(() => {
        if (fs.existsSync(moveFile)) {
          const moves = fs.readFileSync(moveFile, 'utf-8');
          resolve(moves);
        } else {
          console.log(`Move file not found: ${moveFile}`);
          resolve(''); // No moves
        }
      }, 100);
    });

    proc.on('error', (err) => {
      console.error(`Failed to start agent: ${err.message}`);
      reject(err);
    });
  });
}

// Generate step file content
function generateStepFile(state, playerId) {
  const visible = getVisibleNodes(state, playerId);
  const player = state[playerId];
  const opponent = playerId === 'red' ? 'blue' : 'red';

  // Line 1: Fernie counts (-1 for invisible)
  const fernieLine = state.nodes
    .map((n, i) => visible.includes(i) ? n.fernies.toString() : '-1')
    .join(',');

  // Line 2: Owner info (Y = you, N = opponent, U = uncontrolled)
  const ownerLine = state.nodes
    .map((n, i) => {
      if (!visible.includes(i)) return 'H'; // Hidden
      if (n.owner === playerId) return 'Y';
      if (n.owner === opponent) return 'N';
      return 'U';
    })
    .join(',');

  // Line 3: New Fernies available
  const newFerniesLine = player.newFernies.toString();

  // Line 4: Max Fernies per node
  const maxFerniesLine = state.currentMaxFernies.toString();

  return `${fernieLine}\n${ownerLine}\n${newFerniesLine}\n${maxFerniesLine}\n`;
}

// Get visible nodes for a player
function getVisibleNodes(state, playerId) {
  const { visibilityRange, ringSize } = state.settings;
  const visible = new Set();

  state.nodes.forEach((node) => {
    if (node.owner === playerId) {
      for (let offset = -visibilityRange; offset <= visibilityRange; offset++) {
        const idx = (node.index + offset + ringSize) % ringSize;
        visible.add(idx);
      }
    }
  });

  return Array.from(visible);
}

// Parse move file content
function parseMoveFile(content) {
  const moves = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/[,\s]+/);
    if (parts.length >= 2) {
      const nodeIndex = parseInt(parts[0], 10);
      const amount = parseInt(parts[1], 10);
      if (!isNaN(nodeIndex) && !isNaN(amount)) {
        moves.push({ nodeIndex, amount });
      }
    }
  }

  return moves;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Upload JAR file
  if (req.method === 'POST' && req.url === '/upload') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'];
      const boundary = contentType.split('boundary=')[1];
      const parts = parseMultipart(buffer, boundary);

      if (parts.file && parts.file.data) {
        const filename = parts.file.filename || 'agent.jar';
        const filepath = path.join(AGENTS_DIR, filename);
        fs.writeFileSync(filepath, parts.file.data);

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filename, path: filepath }));
      } else {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file uploaded' }));
      }
    });
    return;
  }

  // List uploaded agents
  if (req.method === 'GET' && req.url === '/agents') {
    const files = fs.readdirSync(AGENTS_DIR).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ agents: files }));
    return;
  }

  // Execute turn
  if (req.method === 'POST' && req.url === '/execute') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const { state, redAgent, blueAgent } = body;

        const result = { redMoves: [], blueMoves: [] };
        const turnDir = path.join(TEMP_DIR, `turn_${state.step}`);

        if (!fs.existsSync(turnDir)) fs.mkdirSync(turnDir, { recursive: true });

        // Execute red agent if JAR specified
        if (redAgent && redAgent !== 'builtin') {
          const jarPath = path.join(AGENTS_DIR, redAgent);
          if (fs.existsSync(jarPath)) {
            const stepContent = generateStepFile(state, 'red');
            const stepFile = path.join(turnDir, `${state.step}.step`);
            fs.writeFileSync(stepFile, stepContent);

            try {
              const moveContent = await executeAgent(jarPath, stepFile, 'red', state.step);
              result.redMoves = parseMoveFile(moveContent);
            } catch (err) {
              console.error('Red agent error:', err);
            }
          }
        }

        // Execute blue agent if JAR specified
        if (blueAgent && blueAgent !== 'builtin') {
          const jarPath = path.join(AGENTS_DIR, blueAgent);
          if (fs.existsSync(jarPath)) {
            const stepContent = generateStepFile(state, 'blue');
            const stepFile = path.join(turnDir, `${state.step}.step`);
            fs.writeFileSync(stepFile, stepContent);

            try {
              const moveContent = await executeAgent(jarPath, stepFile, 'blue', state.step);
              result.blueMoves = parseMoveFile(moveContent);
            } catch (err) {
              console.error('Blue agent error:', err);
            }
          }
        }

        // Cleanup old turn directories (keep last 10)
        const turns = fs.readdirSync(TEMP_DIR)
          .filter(d => d.startsWith('turn_'))
          .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));
        while (turns.length > 10) {
          const old = turns.shift();
          fs.rmSync(path.join(TEMP_DIR, old), { recursive: true, force: true });
        }

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('Execute error:', err);
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 404
  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`RINGwars Agent Server running on http://localhost:${PORT}`);
  console.log(`Agents directory: ${AGENTS_DIR}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /upload - Upload JAR file`);
  console.log(`  GET  /agents - List uploaded agents`);
  console.log(`  POST /execute - Execute turn with agents`);
  console.log(`  GET  /health - Health check`);
});
