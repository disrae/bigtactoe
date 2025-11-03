import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";

interface Player {
  name: string;
  playerId: string;
}

interface WaitingRoomProps {
  players: Player[];
  currentPlayerName: string;
  onStartGame: () => void;
}

export default function WaitingRoom({
  players,
  currentPlayerName,
  onStartGame,
}: WaitingRoomProps) {
  const isInQueue = players.some((p) => p.name === currentPlayerName);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiting for Players</Text>
      <Text style={styles.subtitle}>
        {players.length} player{players.length !== 1 ? "s" : ""} in queue
      </Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item }) => (
          <View style={styles.playerItem}>
            <Text style={styles.playerName}>{item.name}</Text>
            {item.name === currentPlayerName && (
              <Text style={styles.youLabel}>(You)</Text>
            )}
          </View>
        )}
        style={styles.list}
      />

      {isInQueue && players.length >= 2 && (
        <TouchableOpacity style={styles.button} onPress={onStartGame}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      {players.length < 2 && (
        <Text style={styles.waitingText}>
          Need at least 2 players to start
        </Text>
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
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  list: {
    width: "100%",
    marginBottom: 20,
  },
  playerItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  playerName: {
    fontSize: 18,
    flex: 1,
  },
  youLabel: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  waitingText: {
    marginTop: 20,
    color: "#999",
    fontSize: 14,
  },
});

