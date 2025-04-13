import React, { useState } from 'react';
import './App.css';

function App() {
  const [edges, setEdges] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceNode, setSourceNode] = useState('');
  const [suspicious, setSuspicious] = useState([]);
  const [distances, setDistances] = useState({});
  const [hasCycle, setHasCycle] = useState(false);

  const addEdge = () => {
    if (from && to && amount) {
      setEdges([...edges, { from: parseInt(from), to: parseInt(to), weight: parseFloat(amount) }]);
      setFrom('');
      setTo('');
      setAmount('');
    }
  };

  const detectFraud = () => {
    const adj = {};
    edges.forEach(({ from, to, weight }) => {
      if (!adj[from]) adj[from] = [];
      adj[from].push({ to, weight });
    });

    const suspiciousTxns = edges.filter(e => e.weight > 10000);
    setSuspicious(suspiciousTxns);

    const visited = {}, recStack = {};
    let cycleFound = false;
    const dfs = (node) => {
      if (recStack[node]) return true;
      if (visited[node]) return false;
      visited[node] = recStack[node] = true;
      for (let neighbor of (adj[node] || [])) {
        if (dfs(neighbor.to)) return true;
      }
      recStack[node] = false;
      return false;
    };

    for (let node in adj) {
      if (dfs(node)) {
        cycleFound = true;
        break;
      }
    }

    setHasCycle(cycleFound);

    if (sourceNode !== '') {
      const dist = {};
      const pq = [];
      edges.forEach(e => {
        dist[e.from] = Infinity;
        dist[e.to] = Infinity;
      });
      dist[sourceNode] = 0;
      pq.push([0, parseInt(sourceNode)]);

      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]);
        const [curDist, u] = pq.shift();
        if (!adj[u]) continue;
        for (const { to, weight } of adj[u]) {
          if (dist[to] > curDist + weight) {
            dist[to] = curDist + weight;
            pq.push([dist[to], to]);
          }
        }
      }

      setDistances(dist);
    }
  };

  return (
    <div className="App">
      <h1>💰 Fraud Graph Analyzer</h1>

      <div className="input-section">
        <input type="number" placeholder="From Node" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="number" placeholder="To Node" value={to} onChange={(e) => setTo(e.target.value)} />
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button onClick={addEdge}>➕ Add Transaction</button>
      </div>

      <div className="edge-list">
        <h3>📊 Transactions:</h3>
        <ul>
          {edges.map((e, i) => (
            <li key={i}>{e.from} ➡ {e.to} (${e.weight})</li>
          ))}
        </ul>
      </div>

      <div className="actions">
        <input type="number" placeholder="Source for Dijkstra" value={sourceNode} onChange={(e) => setSourceNode(e.target.value)} />
        <button onClick={detectFraud}>🚨 Analyze</button>
      </div>

      {suspicious.length > 0 && (
        <div className="suspicious">
          <h3>🚩 Suspicious Transactions (amount > $10,000):</h3>
          <ul>
            {suspicious.map((e, i) => (
              <li key={i}>{e.from} ➡ {e.to} (${e.weight})</li>
            ))}
          </ul>
        </div>
      )}

      {hasCycle && (
        <div className="cycle-alert">
          ⚠️ Cycle Detected in Transactions (Possible Fraud Loop)
        </div>
      )}

      {Object.keys(distances).length > 0 && (
        <div className="distances">
          <h3>📍 Shortest Paths from Node {sourceNode}</h3>
          <ul>
            {Object.entries(distances).map(([node, dist], i) => (
              <li key={i}>Node {node}: {dist === Infinity ? "Unreachable" : `$${dist.toFixed(0)}`}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
