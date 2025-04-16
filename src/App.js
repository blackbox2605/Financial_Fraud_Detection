import React, { useState, useEffect } from 'react';
import './App.css';
import GraphVisualizer from './GraphVisualizer';
import transactions from './transactions.json';

function App() {
  const [edges, setEdges] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionName, setTransactionName] = useState('');
  const [country, setCountry] = useState('');
  const [sourceNode, setSourceNode] = useState('');
  const [suspicious, setSuspicious] = useState([]);
  const [distances, setDistances] = useState({});
  const [hasCycle, setHasCycle] = useState(false);
  const [moneyMules, setMoneyMules] = useState([]);
  const [searchDepth, setSearchDepth] = useState(3);
  const [algorithmResults, setAlgorithmResults] = useState({});

  // Build adjacency list from edges
  const buildAdjacencyList = () => {
    const adj = {};
    edges.forEach(({ from, to, weight }) => {
      if (!adj[from]) adj[from] = [];
      adj[from].push({ to, weight });
      // Ensure all nodes are in the adjacency list
      if (!adj[to]) adj[to] = [];
    });
    return adj;
  };

  const addEdge = () => {
    if (from && to && amount) {
      const timestamp = new Date().toLocaleString();
      const newEdge = {
        from,
        to,
        weight: parseFloat(amount),
        transactionName,
        country,
        timestamp
      };
      setEdges([...edges, newEdge]);
      setFrom('');
      setTo('');
      setAmount('');
      setTransactionName('');
      setCountry('');
    }
  };

  const sample = () => {
    const formatted = transactions.map(tx => ({
      from: tx.from.toString(),
      to: tx.to.toString(),
      weight: tx.amountTransferred,
      timestamp: tx.timestamp || new Date().toLocaleString()
    }));
    setEdges([...edges, ...formatted]);
  };

  // BFS to detect money mules at specific depths
  const detectMoneyMules = (startNode, depth) => {
    const adj = buildAdjacencyList();
    const queue = [{ node: startNode, level: 0 }];
    const visited = new Set();
    const mules = [];
    
    visited.add(startNode);

    while (queue.length > 0) {
      const { node, level } = queue.shift();
      
      if (level === depth) {
        mules.push(node);
        continue; // Don't explore further for this path
      }

      for (const neighbor of adj[node] || []) {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to);
          queue.push({ node: neighbor.to, level: level + 1 });
        }
      }
    }

    return mules;
  };

  // DFS to detect circular transactions
  const detectCircularTransactions = () => {
    const adj = buildAdjacencyList();
    const visited = {};
    const recStack = {};
    let cycleFound = false;
    const cycleNodes = [];
    const cycleEdges = [];
  
    const dfs = (node, path = []) => {
      if (recStack[node]) {
        // Found a cycle - get the portion of the path that forms the cycle
        const cycleStartIndex = path.indexOf(node);
        const cyclePath = path.slice(cycleStartIndex);
        
        // Store the cycle in correct order
        cycleNodes.push(...cyclePath);
        
        // Store the edges in the cycle
        for (let i = 0; i < cyclePath.length; i++) {
          const from = cyclePath[i];
          const to = cyclePath[(i + 1) % cyclePath.length];
          if (adj[from]?.some(edge => edge.to === to)) {
            cycleEdges.push({ from, to });
          }
        }
        
        cycleFound = true;
        return true;
      }
      
      if (visited[node]) return false;
      
      visited[node] = true;
      recStack[node] = true;
      path.push(node);
      
      for (const neighbor of adj[node] || []) {
        if (dfs(neighbor.to, path)) {
          // Don't continue exploring if we found a cycle
          recStack[node] = false;
          path.pop();
          return true;
        }
      }
      
      recStack[node] = false;
      path.pop();
      return false;
    };
  
    for (const node in adj) {
      if (!visited[node]) {
        dfs(node);
        if (cycleFound) break; // Stop after finding first cycle for simplicity
      }
    }
  
    return {
      hasCycle: cycleFound,
      cycleNodes: [...new Set(cycleNodes)], // Remove duplicates while preserving order
      cycleEdges
    };
  };
  // Dijkstra's algorithm to trace high-value paths
  const traceHighValuePaths = (startNode) => {
    const adj = buildAdjacencyList();
    const dist = {};
    const prev = {};
    const pq = [];
    
    // Initialize distances
    for (const node in adj) {
      dist[node] = Infinity;
      prev[node] = null;
    }
    dist[startNode] = 0;
    
    // Priority queue (simplified)
    pq.push({ node: startNode, distance: 0 });
    
    while (pq.length > 0) {
      // Sort to simulate priority queue (would be better with a real heap)
      pq.sort((a, b) => a.distance - b.distance);
      const { node, distance } = pq.shift();
      
      if (distance > dist[node]) continue;
      
      for (const neighbor of adj[node] || []) {
        const alt = dist[node] + neighbor.weight;
        if (alt < dist[neighbor.to]) {
          dist[neighbor.to] = alt;
          prev[neighbor.to] = node;
          pq.push({ node: neighbor.to, distance: alt });
        }
      }
    }
    
    return { distances: dist, predecessors: prev };
  };

  // Enhanced fraud detection combining all algorithms
  const detectFraud = () => {
    // Basic suspicious transaction detection
    const adj = {};
    const countMap = {};
    const amountMap = {};

    edges.forEach(({ from, to, weight }) => {
      if (!adj[from]) adj[from] = [];
      adj[from].push({ to, weight });

      const key = `${from}-${to}`;
      countMap[key] = (countMap[key] || 0) + 1;

      if (!amountMap[from]) amountMap[from] = [];
      amountMap[from].push(weight);
    });

    const avgAmount = {};
    for (let sender in amountMap) {
      const total = amountMap[sender].reduce((a, b) => a + b, 0);
      avgAmount[sender] = total / amountMap[sender].length;
    }

    const suspiciousTxns = edges.filter(e => {
      const highAmount = e.weight > 10000;
      const frequentPair = countMap[`${e.from}-${e.to}`] > 3;
      const selfLoop = e.from === e.to;
      const spikedAmount = e.weight > 5 * (avgAmount[e.from] || 1);
      return highAmount || frequentPair || selfLoop || spikedAmount;
    });

    setSuspicious(suspiciousTxns);

    // Run all fraud detection algorithms
    const results = {};
    
    // 1. Detect money mules with BFS
    if (sourceNode) {
      const mules = detectMoneyMules(sourceNode, searchDepth);
      setMoneyMules(mules);
      results.bfs = {
        moneyMules: mules,
        depth: searchDepth
      };
    }
    
    // 2. Detect circular transactions with DFS
    const { hasCycle, cycleNodes, cycleEdges } = detectCircularTransactions();
    setHasCycle(hasCycle);
    results.dfs = {
      hasCycle,
      cycleNodes,
      cycleEdges
    };
    
    // 3. Trace high-value paths with Dijkstra's
    if (sourceNode) {
      const { distances, predecessors } = traceHighValuePaths(sourceNode);
      setDistances(distances);
      results.dijkstra = {
        distances,
        predecessors
      };
    }
    
    setAlgorithmResults(results);
  };

  return (
    <div className="App">
      <h1 className="text-lg font-semibold p-0 m-0">FRAUD DETECTION IN FINANCIAL TRANSACTIONS</h1>
      <div className="main-content">
        <div className="graph-container">
        <GraphVisualizer 
            edges={edges} 
            suspicious={suspicious} 
            highlightNodes={hasCycle ? algorithmResults.dfs?.cycleNodes : []}
            highlightEdges={hasCycle ? algorithmResults.dfs?.cycleEdges : []}
            // highlightNodes={moneyMules}
            sourceNode={sourceNode}
          />
        </div>

        <div className="control-panel">
          <div className="input-section">
            <input type="text" placeholder="From User" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="text" placeholder="To User" value={to} onChange={(e) => setTo(e.target.value)} />
            <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={addEdge}>➕ Add Transaction</button>
          </div>

          <button onClick={sample}>📥 Load Sample Transactions</button>

          <div className="edge-list">
            <h3>📊 Transactions:</h3>
            <ul>
              {edges.map((e, i) => (
                <li key={i} className={suspicious.includes(e) ? 'suspicious' : ''}>
                  <strong>{e.from}</strong> ➡ <strong>{e.to}</strong> (${e.weight})<br />
                  <small>{e.timestamp}</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="actions">
            <div className="algorithm-controls">
              <input
                type="text"
                placeholder="Source User"
                value={sourceNode}
                onChange={(e) => setSourceNode(e.target.value)}
              />
              <div className="depth-control">
                <label>BFS Depth:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={searchDepth}
                  onChange={(e) => setSearchDepth(parseInt(e.target.value))}
                />
              </div>
            </div>
            <button onClick={detectFraud}>🚨 Analyze for Fraud</button>
          </div>

          {suspicious.length > 0 && (
            <div className="suspicious-container">
              <h3>🚩 Suspicious Transactions:</h3>
              <div className="suspicious-list">
                {suspicious.map((e, i) => (
                  <div key={i} className="suspicious-card">
                    <p><strong>{e.from}</strong> ➡ <strong>{e.to}</strong></p>
                    <p>💰 Amount: ${e.weight}</p>
                    <p>🕒 Timestamp: {e.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {moneyMules.length > 0 && (
            <div className="algorithm-result">
              <h3>🕵️ BFS Detected Money Mules (Depth {searchDepth}):</h3>
              <ul>
                {moneyMules.map((node, i) => (
                  <li key={i}>{node}</li>
                ))}
              </ul>
            </div>
          )}

          {hasCycle && (
            <div className="algorithm-result">
              <h3>🔄 DFS Detected Circular Transactions:</h3>
              <p>Nodes involved in cycles: {algorithmResults.dfs?.cycleNodes.join(', ')}</p>
            </div>
          )}

          {sourceNode && Object.keys(distances).length > 0 && (
            <div className="algorithm-result">
              <h3>📍 Dijkstra's Shortest Paths from {sourceNode}:</h3>
              <div className="distance-grid">
                {Object.entries(distances)
                  .filter(([_, dist]) => dist !== Infinity)
                  .sort((a, b) => b[1] - a[1])
                  .map(([node, dist], i) => (
                    <div key={i} className="distance-card">
                      <strong>{node}</strong>: ${dist.toFixed(2)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
