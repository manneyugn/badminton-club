export const SPREADSHEET_ID = process.env.SPREADSHEET_ID!

export const RANGES = {
  players: {
    all: 'players!A2:I',
    cols: 'players!A:I',
  },
  sets: {
    all: 'sets!A2:M',
    cols: 'sets!A:M',
  },
  eloHistory: {
    all: 'elo_history!A2:G',
    cols: 'elo_history!A:G',
  },
  writeLock: {
    row: 'write_log!A2:E2',
  },
} as const
