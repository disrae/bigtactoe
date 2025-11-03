import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import GameBoard from "../components/GameBoard";
import WaitingRoom from "../components/WaitingRoom";
import { api } from "../convex/_generated/api";

export default function Index() {
  const [playerName, setPlayerName] = useState("");

  // Load player name from storage on mount
  useEffect(() => {
    // For web, try localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem("playerName");
      if (saved) {
        setPlayerName(saved);
      }
    }
  }, []);

  // Queries
  // @ts-expect-error - API types will be generated when Convex compiles
  const queue = useQuery(api.game.getQueue);
  // @ts-expect-error - API types will be generated when Convex compiles
  const game = useQuery(api.game.getGame);

  // Mutations
  // @ts-expect-error - API types will be generated when Convex compiles
  const joinQueueMutation = useMutation(api.game.joinQueue);
  // @ts-expect-error - API types will be generated when Convex compiles
  const startGameMutation = useMutation(api.game.startGame);
  // @ts-expect-error - API types will be generated when Convex compiles
  const makeMoveMutation = useMutation(api.game.makeMove);
  // @ts-expect-error - API types will be generated when Convex compiles
  const resetGameMutation = useMutation(api.game.resetGame);

  // Handle name submission
  const handleSubmitName = async () => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    try {
      // Save to localStorage on web
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("playerName", playerName.trim());
      }

      await joinQueueMutation({ name: playerName.trim() });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to join queue");
    }
  };

  // Handle start game
  const handleStartGame = async () => {
    try {
      await startGameMutation();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start game");
    }
  };

  // Handle cell press
  const handleCellPress = async (row: number, col: number) => {
    if (!playerName) return;

    try {
      await makeMoveMutation({
        playerName: playerName,
        row,
        col,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to make move");
    }
  };

  // Handle reset game
  const handleResetGame = async () => {
    try {
      await resetGameMutation();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reset game");
    }
  };

  // Show name entry if no name set
  if (!playerName) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Tic Tac Toe!</Text>
        <Text style={styles.subtitle}>Enter your name to join the game</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={playerName}
          onChangeText={setPlayerName}
          onSubmitEditing={handleSubmitName}
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmitName}>
          <Text style={styles.buttonText}>Join Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show waiting room if no game exists
  if (!game) {
    return (
      <WaitingRoom
        players={queue || []}
        currentPlayerName={playerName}
        onStartGame={handleStartGame}
      />
    );
  }

  // Show game board if game is active
  return (
    <GameBoard
      board={game.board}
      currentPlayerName={game.players[game.currentPlayerIndex]}
      players={game.players}
      winner={game.winner}
      onCellPress={handleCellPress}
      onReset={handleResetGame}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    maxWidth: 300,
    height: 50,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
