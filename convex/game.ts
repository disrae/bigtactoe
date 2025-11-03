import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate unique player ID
function generatePlayerId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Join the waiting queue
export const joinQueue = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if there's an active game
    const activeGame = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();

    if (activeGame) {
      throw new Error("Game is in progress. Please wait for the next game.");
    }

    // Generate player ID first
    const playerId = generatePlayerId();
    
    // Check if player with same name already exists in queue
    const existingPlayers = await ctx.db.query("players").collect();
    const existingPlayer = existingPlayers.find((p) => p.name === args.name);

    if (existingPlayer) {
      return existingPlayer.playerId;
    }

    // Add player to queue
    await ctx.db.insert("players", {
      name: args.name,
      playerId: playerId,
    });

    return playerId;
  },
});

// Get current waiting queue
export const getQueue = query({
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    return players.map((p) => ({ name: p.name, playerId: p.playerId }));
  },
});

// Get current game state (active or finished)
export const getGame = query({
  handler: async (ctx) => {
    // First try to get active game
    const activeGame = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();

    if (activeGame) {
      return activeGame;
    }

    // If no active game, check for finished game
    const finishedGame = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .first();

    return finishedGame;
  },
});

// Check for win condition (n+1 in a row)
function checkWin(
  board: (string | null)[][],
  row: number,
  col: number,
  playerMark: string
): boolean {
  const n = board.length - 1; // n+1 = board size, so n = players count
  const winCount = n + 1;

  // Check horizontal - look for winCount consecutive cells
  let count = 0;
  for (let c = 0; c < board.length; c++) {
    if (board[row][c] === playerMark) {
      count++;
      if (count === winCount) return true;
    } else {
      count = 0;
    }
  }

  // Check vertical
  count = 0;
  for (let r = 0; r < board.length; r++) {
    if (board[r][col] === playerMark) {
      count++;
      if (count === winCount) return true;
    } else {
      count = 0;
    }
  }

  // Check main diagonal (top-left to bottom-right)
  // Find the top-left cell of the diagonal
  let startRow = row;
  let startCol = col;
  while (startRow > 0 && startCol > 0) {
    startRow--;
    startCol--;
  }
  count = 0;
  while (startRow < board.length && startCol < board.length) {
    if (board[startRow][startCol] === playerMark) {
      count++;
      if (count === winCount) return true;
    } else {
      count = 0;
    }
    startRow++;
    startCol++;
  }

  // Check anti-diagonal (top-right to bottom-left)
  // Find the top-right cell of the diagonal
  startRow = row;
  startCol = col;
  while (startRow > 0 && startCol < board.length - 1) {
    startRow--;
    startCol++;
  }
  count = 0;
  while (startRow < board.length && startCol >= 0) {
    if (board[startRow][startCol] === playerMark) {
      count++;
      if (count === winCount) return true;
    } else {
      count = 0;
    }
    startRow++;
    startCol--;
  }

  return false;
}

// Start a new game with all waiting players
export const startGame = mutation({
  handler: async (ctx) => {
    // Check if there's already an active game
    const activeGame = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();

    if (activeGame) {
      throw new Error("A game is already in progress");
    }

    // Clean up any finished games
    const finishedGames = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .collect();
    
    for (const finishedGame of finishedGames) {
      await ctx.db.delete(finishedGame._id);
    }

    // Get all players in queue
    const players = await ctx.db.query("players").collect();
    if (players.length < 2) {
      throw new Error("Need at least 2 players to start a game");
    }

    const playerNames = players.map((p) => p.name);
    const boardSize = players.length + 1;
    const board: (string | null)[][] = [];
    for (let i = 0; i < boardSize; i++) {
      board.push(new Array(boardSize).fill(null));
    }

    // Create new game
    const gameId = await ctx.db.insert("game", {
      status: "active",
      players: playerNames,
      board: board,
      currentPlayerIndex: 0,
      winner: null,
      createdAt: Date.now(),
    });

    // Clear the waiting queue
    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    return gameId;
  },
});

// Make a move
export const makeMove = mutation({
  args: {
    playerName: v.string(),
    row: v.number(),
    col: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();

    if (!game) {
      throw new Error("No active game");
    }

    // Verify it's this player's turn
    const currentPlayerName = game.players[game.currentPlayerIndex];
    if (currentPlayerName !== args.playerName) {
      throw new Error("Not your turn");
    }

    // Verify the cell is empty
    if (game.board[args.row][args.col] !== null) {
      throw new Error("Cell is already occupied");
    }

    // Make the move
    const newBoard = game.board.map((r) => [...r]);
    newBoard[args.row][args.col] = args.playerName;

    // Check for win
    const hasWon = checkWin(newBoard, args.row, args.col, args.playerName);

    if (hasWon) {
      // Game ends, player wins
      await ctx.db.patch(game._id, {
        status: "finished",
        board: newBoard,
        winner: args.playerName,
      });
    } else {
      // Check for draw (board full)
      const isBoardFull = newBoard.every((row) =>
        row.every((cell) => cell !== null)
      );

      if (isBoardFull) {
        await ctx.db.patch(game._id, {
          status: "finished",
          board: newBoard,
          winner: null, // Draw
        });
      } else {
        // Continue game, next player's turn
        const nextPlayerIndex =
          (game.currentPlayerIndex + 1) % game.players.length;
        await ctx.db.patch(game._id, {
          board: newBoard,
          currentPlayerIndex: nextPlayerIndex,
        });
      }
    }
  },
});

// Reset game - clear finished game and move players back to queue
export const resetGame = mutation({
  handler: async (ctx) => {
    // Get finished game
    const finishedGame = await ctx.db
      .query("game")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .first();

    if (!finishedGame) {
      throw new Error("No finished game to reset");
    }

    // Move players back to queue
    for (const playerName of finishedGame.players) {
      const playerId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await ctx.db.insert("players", {
        name: playerName,
        playerId: playerId,
      });
    }

    // Delete finished game
    await ctx.db.delete(finishedGame._id);
  },
});

