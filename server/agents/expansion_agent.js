#!/usr/bin/env node
/**
 * RINGwars Expansion Agent (Node.js)
 * Strategy: Rapidly expand territory, control as many nodes as possible.
 */

const fs = require('fs');
const path = require('path');

function parseStepFile(stepNum) {
    const stepFile = `${stepNum}.step`;
    if (!fs.existsSync(stepFile)) {
        return null;
    }

    const content = fs.readFileSync(stepFile, 'utf-8');
    const lines = content.trim().split('\n');

    const fernies = lines[0].split(',').map(Number);
    const owners = lines[1].split(',');
    const newFernies = parseInt(lines[2], 10);
    const maxFernies = parseInt(lines[3], 10);

    return {
        fernies,
        owners,
        newFernies,
        maxFernies,
        ringSize: fernies.length
    };
}

function getAdjacent(idx, ringSize) {
    return [
        (idx - 1 + ringSize) % ringSize,
        (idx + 1) % ringSize
    ];
}

function findExpansionTargets(state) {
    const targets = [];
    const { ringSize, owners } = state;

    // Find all neutral nodes adjacent to our territory
    for (let i = 0; i < ringSize; i++) {
        if (owners[i] === 'Y') {
            for (const adj of getAdjacent(i, ringSize)) {
                if (owners[adj] === 'U') {
                    // Check if this neutral has enemy neighbors (contested)
                    const enemyNearby = getAdjacent(adj, ringSize).some(
                        n => owners[n] === 'N'
                    );
                    targets.push({
                        node: adj,
                        contested: enemyNearby,
                        from: i
                    });
                }
            }
        }
    }

    // Remove duplicates, prioritize contested nodes
    const seen = new Set();
    const unique = [];
    for (const t of targets) {
        if (!seen.has(t.node)) {
            seen.add(t.node);
            unique.push(t);
        }
    }

    // Sort: contested first (race for territory)
    return unique.sort((a, b) => b.contested - a.contested);
}

function countTerritory(state) {
    return state.owners.filter(o => o === 'Y').length;
}

function decideMoves(state) {
    const moves = [];
    let remaining = state.newFernies;

    if (remaining <= 0) return moves;

    const expansionTargets = findExpansionTargets(state);
    const myTerritory = countTerritory(state);

    // Priority 1: Grab contested neutral nodes before enemy
    for (const target of expansionTargets.filter(t => t.contested)) {
        if (remaining >= 5) {
            const amount = Math.min(remaining, 10);
            moves.push([target.node, amount]);
            remaining -= amount;
            if (remaining <= 0) return moves;
        }
    }

    // Priority 2: Expand to any neutral
    for (const target of expansionTargets.filter(t => !t.contested)) {
        if (remaining >= 3) {
            const amount = Math.min(remaining, 5);
            moves.push([target.node, amount]);
            remaining -= amount;
            if (remaining <= 0) return moves;
        }
    }

    // Priority 3: If we have more territory, attack weak enemies
    if (myTerritory > state.ringSize / 3) {
        for (let i = 0; i < state.ringSize; i++) {
            if (state.owners[i] === 'Y') {
                for (const adj of getAdjacent(i, state.ringSize)) {
                    if (state.owners[adj] === 'N' && state.fernies[adj] < remaining) {
                        moves.push([adj, remaining]);
                        return moves;
                    }
                }
            }
        }
    }

    // Priority 4: Spread remaining across border nodes
    if (remaining > 0) {
        const borderNodes = [];
        for (let i = 0; i < state.ringSize; i++) {
            if (state.owners[i] === 'Y') {
                const hasNonOwned = getAdjacent(i, state.ringSize).some(
                    adj => state.owners[adj] !== 'Y'
                );
                if (hasNonOwned) {
                    borderNodes.push(i);
                }
            }
        }

        if (borderNodes.length > 0) {
            const perNode = Math.ceil(remaining / borderNodes.length);
            for (const node of borderNodes) {
                const amount = Math.min(remaining, perNode);
                if (amount > 0) {
                    moves.push([node, amount]);
                    remaining -= amount;
                }
            }
        }
    }

    return moves;
}

function writeMoveFile(agentName, moves) {
    const moveFile = `${agentName}.move`;
    const content = moves.map(([node, amount]) => `${node},${amount}`).join('\n');
    fs.writeFileSync(moveFile, content + '\n');
}

function main() {
    if (process.argv.length < 4) {
        console.log('Usage: node expansion_agent.js <step_num> <agent_name>');
        process.exit(1);
    }

    const stepNum = process.argv[2];
    const agentName = process.argv[3];

    const state = parseStepFile(stepNum);
    if (!state) {
        console.log(`Could not read step file: ${stepNum}.step`);
        process.exit(1);
    }

    const moves = decideMoves(state);
    writeMoveFile(agentName, moves);

    const totalPlaced = moves.reduce((sum, [_, amt]) => sum + amt, 0);
    console.log(`Expansion Agent: Placed ${totalPlaced} fernies on ${moves.length} nodes`);
}

main();
