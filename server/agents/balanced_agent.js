#!/usr/bin/env node
/**
 * RINGwars Balanced Agent (Node.js)
 * Strategy: Adapt based on game state - expand early, attack mid, defend late.
 */

const fs = require('fs');

function parseStepFile(stepNum) {
    const stepFile = `${stepNum}.step`;
    if (!fs.existsSync(stepFile)) {
        return null;
    }

    const content = fs.readFileSync(stepFile, 'utf-8');
    const lines = content.trim().split('\n');

    return {
        fernies: lines[0].split(',').map(Number),
        owners: lines[1].split(','),
        newFernies: parseInt(lines[2], 10),
        maxFernies: parseInt(lines[3], 10),
        ringSize: lines[0].split(',').length
    };
}

function getAdjacent(idx, ringSize) {
    return [
        (idx - 1 + ringSize) % ringSize,
        (idx + 1) % ringSize
    ];
}

function analyzeGameState(state) {
    let myNodes = 0, enemyNodes = 0, neutralNodes = 0;
    let myTotal = 0, enemyTotal = 0;
    const myIndices = [];

    for (let i = 0; i < state.ringSize; i++) {
        const owner = state.owners[i];
        const fern = state.fernies[i];

        if (owner === 'Y') {
            myNodes++;
            myTotal += fern;
            myIndices.push(i);
        } else if (owner === 'N') {
            enemyNodes++;
            enemyTotal += fern;
        } else if (owner === 'U') {
            neutralNodes++;
        }
    }

    // Determine game phase
    let phase;
    if (neutralNodes > state.ringSize * 0.3) {
        phase = 'early';  // Still lots of neutral - expand
    } else if (myTotal > enemyTotal * 1.3) {
        phase = 'winning'; // We're ahead - press advantage
    } else if (enemyTotal > myTotal * 1.3) {
        phase = 'losing';  // We're behind - play defensive
    } else {
        phase = 'mid';     // Even game - balanced play
    }

    return {
        myNodes, enemyNodes, neutralNodes,
        myTotal, enemyTotal,
        myIndices, phase
    };
}

function findBestMove(state, analysis) {
    const { ringSize, owners, fernies, newFernies } = state;
    const { phase, myIndices } = analysis;

    // Find all possible targets with scores
    const targets = [];

    for (const myIdx of myIndices) {
        for (const adj of getAdjacent(myIdx, ringSize)) {
            const adjOwner = owners[adj];
            const adjFernies = fernies[adj];

            if (adjOwner === 'U') {
                // Neutral node - good for expansion
                targets.push({
                    node: adj,
                    type: 'expand',
                    priority: phase === 'early' ? 100 : 50,
                    cost: 1
                });
            } else if (adjOwner === 'N') {
                // Enemy node - check if attackable
                if (newFernies > adjFernies) {
                    targets.push({
                        node: adj,
                        type: 'attack',
                        priority: phase === 'winning' ? 100 : 70,
                        cost: adjFernies + 1,
                        enemyStrength: adjFernies
                    });
                }
            }
        }
    }

    // Also consider reinforcing
    for (const myIdx of myIndices) {
        const hasEnemyNeighbor = getAdjacent(myIdx, ringSize).some(
            adj => owners[adj] === 'N'
        );
        if (hasEnemyNeighbor) {
            targets.push({
                node: myIdx,
                type: 'reinforce',
                priority: phase === 'losing' ? 100 : 30,
                currentStrength: fernies[myIdx]
            });
        }
    }

    // Remove duplicates
    const seen = new Set();
    const unique = targets.filter(t => {
        const key = `${t.node}-${t.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Sort by priority, then by efficiency
    unique.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        // For attacks, prefer weaker enemies
        if (a.type === 'attack' && b.type === 'attack') {
            return a.enemyStrength - b.enemyStrength;
        }
        return 0;
    });

    return unique;
}

function decideMoves(state) {
    const moves = [];
    let remaining = state.newFernies;

    if (remaining <= 0) return moves;

    const analysis = analyzeGameState(state);
    const rankedTargets = findBestMove(state, analysis);

    // Execute best moves
    for (const target of rankedTargets) {
        if (remaining <= 0) break;

        if (target.type === 'attack') {
            // Commit all to attack
            moves.push([target.node, remaining]);
            remaining = 0;
        } else if (target.type === 'expand') {
            // Use portion for expansion
            const amount = Math.min(remaining, Math.ceil(state.newFernies / 2));
            moves.push([target.node, amount]);
            remaining -= amount;
        } else if (target.type === 'reinforce') {
            // Reinforce with remaining
            moves.push([target.node, remaining]);
            remaining = 0;
        }
    }

    // Fallback: put remaining on any owned node
    if (remaining > 0 && analysis.myIndices.length > 0) {
        moves.push([analysis.myIndices[0], remaining]);
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
        console.log('Usage: node balanced_agent.js <step_num> <agent_name>');
        process.exit(1);
    }

    const stepNum = process.argv[2];
    const agentName = process.argv[3];

    const state = parseStepFile(stepNum);
    if (!state) {
        console.log(`Could not read step file: ${stepNum}.step`);
        process.exit(1);
    }

    const analysis = analyzeGameState(state);
    const moves = decideMoves(state);
    writeMoveFile(agentName, moves);

    const totalPlaced = moves.reduce((sum, [_, amt]) => sum + amt, 0);
    console.log(`Balanced Agent [${analysis.phase}]: Placed ${totalPlaced} fernies on ${moves.length} nodes`);
}

main();
