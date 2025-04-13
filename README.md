# Fraud Detection Dashboard

A React-based application for detecting fraudulent transactions by analyzing node interactions. It identifies suspicious transactions, detects fraud cycles, and calculates shortest paths using Dijkstra's algorithm with an interactive UI.

## Features

- **Add Transactions**: Input transactions between nodes with specified amounts using form fields.
- **Suspicious Transaction Detection**: Automatically flags transactions exceeding ₹10,000.
- **Cycle Detection**: Identifies looping transactions that may indicate fraud.
- **Shortest Path Calculation**: Implements Dijkstra's algorithm to find optimal paths between nodes.

### Transaction Management
1. Enter **From Node**, **To Node**, and **Amount** in input fields.
2. Click _Add Transaction_ to update the graph.

### Fraud Detection Features
- **Suspicious Transactions**: Displayed in red with 🚩 icon when amount > ₹10,000.
- **Cycle Detection**: Shows warning message ⚠️ when loops are identified.
- **Path Analysis**:
  - Enter source node ➡ Click _Analyze_.
  - Displays shortest paths in the format:
    ```
    Node X: ₹Amount
    ```

## Technologies Used

- **Frontend**: React JS
- **Styling**: CSS Modules
- **Algorithms**:
  - Dijkstra's shortest path
  - Depth-First Search for cycle detection
