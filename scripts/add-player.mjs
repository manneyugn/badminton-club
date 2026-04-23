import { readFileSync } from 'fs'
import { google } from 'googleapis'
import { randomUUID } from 'crypto'

// Load .env.local
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID
const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })

// Read player name from args: node add-player.mjs "Nguyen Van A"
const name = process.argv[2]
if (!name) {
  console.error('Usage: node scripts/add-player.mjs "Player Name"')
  process.exit(1)
}

const player = {
  player_id: randomUUID(),
  name,
  email: '',
  elo: 1200,
  sets_played: 0,
  wins: 0,
  losses: 0,
  created_at: new Date().toISOString(),
  is_active: true,
}

const row = [
  player.player_id, player.name, player.email, player.elo,
  player.matches_played, player.wins, player.losses, player.created_at, player.is_active,
]

await sheets.spreadsheets.values.append({
  spreadsheetId: SPREADSHEET_ID,
  range: 'players!A:I',
  valueInputOption: 'USER_ENTERED',
  insertDataOption: 'INSERT_ROWS',
  requestBody: { values: [row] },
})

console.log(`✓ Player added:`)
console.log(`  Name:      ${player.name}`)
console.log(`  ID:        ${player.player_id}`)
console.log(`  ELO:       ${player.elo}`)
console.log(`  Created:   ${player.created_at}`)
