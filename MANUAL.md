# RINGwars 3D - User Manual

Version: 1.0

---

## 1) Overview

RINGwars 3D is a turn-based strategy game where AI agents compete on a circular ring battlefield. The game features:

- 3D visualization with Three.js
- Multi-language agent support (Java JAR, Python, Node.js)
- Configurable game settings (turn limit, sudden death, decay rate)
- AI competition platform for algorithm testing

---

## 2) Requirements

- Node.js 18+
- npm
- Modern browser (Chrome/Edge/Firefox)

For running agents:
- **Java agents**: Java Runtime Environment (JRE) 8+
- **Python agents**: Python 3.x
- **Node.js agents**: Included with Node.js

---

## 3) Project Setup

From repo root:

```bash
npm install
npm run dev          # Start game server (http://localhost:5173)
npm run agent-server # Start agent server (port 3001) - separate terminal
```

Then open: **http://localhost:5173**

---

## 4) Game Rules

### 4.1 Battlefield
- 20 nodes arranged in a circular ring
- Each node can hold Fernies (units)
- Adjacent nodes can battle

### 4.2 Players
- Two players: **Red** vs **Blue**
- Each controlled by an AI agent
- Starting positions: opposite sides of the ring

### 4.3 Fernies (Units)
- Grow each turn based on owned territory
- Growth rate: 10% of current Fernies per owned node
- Can be placed on any visible node during your turn

### 4.4 Visibility
- Players can only see nodes within range of owned territory
- Hidden nodes show as `-1` Fernies and `H` owner
- Visibility range: 5 nodes from any owned node

### 4.5 Victory Conditions
- **Elimination**: Opponent has no Fernies remaining
- **Turn Limit**: Player with more total Fernies wins
- **Draw**: Equal Fernies at turn limit

---

## 5) Battle Types

| Battle Type | Condition | Resolution |
|-------------|-----------|------------|
| **Local** | Both players place on same node | Higher count wins, loser loses all |
| **Edge** | Adjacent nodes owned by opponents | Larger force wins, difference survives |
| **Triple** | Three consecutive nodes with conflict | Complex multi-node resolution |

---

## 6) Game Settings

Configurable via the UI control panel:

| Setting | Default | Description |
|---------|---------|-------------|
| Turn Limit | 200 | Maximum turns before game ends |
| Sudden Death | 100 | Turn when sudden death begins |
| Decay Rate | 10% | Max Fernies reduced each turn in sudden death |

### Sudden Death Mode
After the sudden death turn:
- Maximum Fernies per node decreases each turn
- Forces players toward engagement
- Prevents infinite stalemates

---

## 7) AI Agent Support

### 7.1 Supported Languages

| Language | Extension | Command |
|----------|-----------|---------|
| Java | `.jar` | `java -jar agent.jar <stepNum> <playerName>` |
| Python | `.py` | `python3 agent.py <stepNum> <playerName>` |
| Node.js | `.js` | `node agent.js <stepNum> <playerName>` |

### 7.2 Agent Protocol

**Input** - `<stepNum>.step` file:
```
10,15,-1,20,8,...      # Line 1: Fernie count per node (-1 = hidden)
Y,Y,H,N,U,...          # Line 2: Owner (Y=you, N=enemy, U=neutral, H=hidden)
25                      # Line 3: New Fernies available this turn
10000                   # Line 4: Current max Fernies per node
```

**Output** - `<playerName>.move` file:
```
5,20                    # Place 20 Fernies on node 5
3,10                    # Place 10 Fernies on node 3
```

### 7.3 Owner Codes

| Code | Meaning |
|------|---------|
| Y | Your node |
| N | Enemy node |
| U | Neutral (unclaimed) |
| H | Hidden (not visible) |

### 7.4 Example Agents

Located in `server/agents/`:

| Agent | Language | Strategy |
|-------|----------|----------|
| `aggressive_agent.py` | Python | Attack weak enemies first |
| `defensive_agent.py` | Python | Build up forces, attack with 2x advantage |
| `expansion_agent.js` | Node.js | Rapidly expand territory |
| `balanced_agent.js` | Node.js | Adapts strategy based on game phase |

---

## 8) Uploading Custom Agents

1. Click **Upload Agent** button in the control panel
2. Select your agent file (`.jar`, `.py`, or `.js`)
3. Select agent from Red/Blue dropdown menus
4. Click **Reset** then **Start Game**

---

## 9) UI Controls

### Control Panel (Left Side)
- **Turn Counter**: Current turn / turn limit
- **Agent Selection**: Dropdown for Red and Blue agents
- **Upload Agent**: Upload custom agent files
- **Settings**: Turn limit, sudden death turn, decay rate
- **Start Game**: Begin auto-play
- **Step**: Execute single turn
- **Auto Play / Stop**: Toggle continuous play
- **Reset**: Reset game with current settings

### 3D View (Right Side)
- Ring visualization with 20 nodes
- Node colors: Red (player), Blue (player), Gray (neutral)
- Fernie counts displayed on each node
- Camera auto-rotates around the ring

---

## 10) File Structure

```
src/ringwars/
  ├── index.ts        # Game orchestration, AI execution
  ├── gameLogic.ts    # Game rules, battles, Fernie growth
  ├── renderer.ts     # Three.js ring visualization
  ├── ui.ts           # Control panel, agent selection
  └── types.ts        # Type definitions, settings

server/
  ├── agent-server.cjs  # Agent execution server
  └── agents/           # Example agents
      ├── aggressive_agent.py
      ├── defensive_agent.py
      ├── expansion_agent.js
      └── balanced_agent.js
```

---

## 11) Common Operations

### Start a Game
```bash
# Terminal 1: Game server
npm run dev

# Terminal 2: Agent server
npm run agent-server

# Browser
http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## 12) Troubleshooting

### Agent Server Not Connecting
- Ensure agent server is running on port 3001
- Check browser console for CORS errors
- Verify `npm run agent-server` shows "Agent server running"

### Agent Not Executing
- Check file extension is supported (`.jar`, `.py`, `.js`)
- Verify Java/Python/Node.js is installed
- Check agent server console for error messages

### Game Running Too Long
- Reduce Turn Limit in settings
- Lower Sudden Death turn to force earlier engagement
- Increase Decay Rate for faster convergence

### No Moves Generated
- Verify agent outputs valid `.move` file format
- Check step file is being read correctly
- Test agent manually: `python3 agent.py 1 red`

---

## 13) Writing Your Own Agent

### Basic Template (Python)
```python
#!/usr/bin/env python3
import sys

def main():
    step_num = sys.argv[1]
    player_name = sys.argv[2]

    # Read step file
    with open(f"{step_num}.step") as f:
        lines = f.read().strip().split('\n')

    fernies = [int(x) for x in lines[0].split(',')]
    owners = lines[1].split(',')
    new_fernies = int(lines[2])
    max_fernies = int(lines[3])

    # Simple strategy: place all on first owned node
    moves = []
    for i, owner in enumerate(owners):
        if owner == 'Y':
            moves.append(f"{i},{new_fernies}")
            break

    # Write move file
    with open(f"{player_name}.move", 'w') as f:
        f.write('\n'.join(moves) + '\n')

if __name__ == '__main__':
    main()
```

### Basic Template (Node.js)
```javascript
#!/usr/bin/env node
const fs = require('fs');

const stepNum = process.argv[2];
const playerName = process.argv[3];

// Read step file
const content = fs.readFileSync(`${stepNum}.step`, 'utf-8');
const lines = content.trim().split('\n');

const fernies = lines[0].split(',').map(Number);
const owners = lines[1].split(',');
const newFernies = parseInt(lines[2], 10);
const maxFernies = parseInt(lines[3], 10);

// Simple strategy: place all on first owned node
const moves = [];
for (let i = 0; i < owners.length; i++) {
    if (owners[i] === 'Y') {
        moves.push(`${i},${newFernies}`);
        break;
    }
}

// Write move file
fs.writeFileSync(`${playerName}.move`, moves.join('\n') + '\n');
```

---

End of manual.
