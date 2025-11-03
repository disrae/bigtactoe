import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface GameBoardProps {
  board: (string | null)[][];
  currentPlayerName: string;
  players: string[];
  winner: string | null;
  onCellPress: (row: number, col: number) => void;
  onReset: () => void;
}

export default function GameBoard({
  board,
  currentPlayerName,
  players,
  winner,
  onCellPress,
  onReset,
}: GameBoardProps) {
  const boardSize = board.length;
  const isGameFinished = winner !== null || board.every((row) => row.every((cell) => cell !== null));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Board</Text>
      <Text style={styles.info}>
        Board: {boardSize} × {boardSize} ({players.length} players)
      </Text>

      {!isGameFinished && (
        <Text style={styles.turnText}>
          {currentPlayerName}'s turn
        </Text>
      )}

      {winner && (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerText}>🎉 {winner} wins! 🎉</Text>
        </View>
      )}

      {!winner && isGameFinished && (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerText}>It's a draw!</Text>
        </View>
      )}

      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  cell && styles.cellFilled,
                  isGameFinished && styles.cellDisabled,
                ]}
                onPress={() => !isGameFinished && onCellPress(rowIndex, colIndex)}
                disabled={isGameFinished || cell !== null}
              >
                <Text style={styles.cellText}>{cell || ""}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {isGameFinished && (
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>Reset & Return to Queue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  turnText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#007AFF",
  },
  winnerContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
  },
  board: {
    marginVertical: 20,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cellFilled: {
    backgroundColor: "#f8f8f8",
  },
  cellDisabled: {
    opacity: 0.6,
  },
  cellText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

