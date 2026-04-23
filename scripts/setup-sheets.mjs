import { readFileSync } from 'fs'
import { google } from 'googleapis'

const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })
const ID = process.env.SPREADSHEET_ID

// Get current sheet metadata
const meta = await sheets.spreadsheets.get({ spreadsheetId: ID })
const sheetMap = Object.fromEntries(meta.data.sheets.map(s => [s.properties.title, s.properties.sheetId]))

console.log('Current tabs:', Object.keys(sheetMap).join(', '))

const requests = []

// Rename 'matches' → 'sets' if it exists
if (sheetMap['matches'] !== undefined) {
  requests.push({
    updateSheetProperties: {
      properties: { sheetId: sheetMap['matches'], title: 'sets' },
      fields: 'title',
    }
  })
  console.log('Will rename: matches → sets')
}

// Create 'sets' tab if neither 'sets' nor 'matches' exist
if (sheetMap['sets'] === undefined && sheetMap['matches'] === undefined) {
  requests.push({ addSheet: { properties: { title: 'sets' } } })
  console.log('Will create: sets tab')
}

if (requests.length > 0) {
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: ID, requestBody: { requests } })
}

// Set correct headers on each tab
const headers = {
  'players':     [['player_id','name','email','elo','sets_played','wins','losses','created_at','is_active']],
  'sets':        [['set_id','match_type','played_at','team_a_p1','team_a_p2','team_b_p1','team_b_p2','score_a','score_b','game_points','winner','recorded_by','status']],
  'elo_history': [['event_id','set_id','player_id','elo_before','elo_after','delta','recorded_at']],
  'write_log':   [['lock_id','acquired_by','acquired_at','expires_at','operation']],
}

for (const [tab, values] of Object.entries(headers)) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: ID,
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
  console.log(`✓ Headers set: ${tab}`)
}

// Also fix existing player row: rename matches_played → sets_played (column E header already fixed above)
// The data row just needs the column to be correct — it's a number so it stays valid

console.log('\nDone. Sheet is ready for set-based recording.')
