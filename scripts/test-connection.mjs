import { readFileSync } from 'fs'
import { google } from 'googleapis'

// Load .env.local manually
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })

async function run() {
  console.log('Testing Google Sheets connection...\n')

  // 1. Check spreadsheet exists and list sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheetNames = meta.data.sheets.map(s => s.properties.title)
  console.log('✓ Connected to:', meta.data.properties.title)
  console.log('  Tabs found:', sheetNames.join(', '))

  // 2. Check required tabs
  const required = ['players', 'matches', 'elo_history', 'write_log']
  const missing = required.filter(r => !sheetNames.includes(r))
  if (missing.length) {
    console.error('\n✗ Missing tabs:', missing.join(', '))
    console.error('  Please create these tabs in your spreadsheet.')
    process.exit(1)
  }
  console.log('✓ All required tabs present')

  // 3. Test read from players tab
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'players!A1:I1',
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const headers = read.data.values?.[0] ?? []
  console.log('✓ Read players header:', headers.length ? headers.join(' | ') : '(empty — add header row)')

  // 4. Test write to write_log (lock row)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'write_log!A2:E2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['TEST', 'test-session', new Date().toISOString(), '', 'connection test']] },
  })
  console.log('✓ Write test passed (wrote to write_log)')

  // 5. Clear the test row
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: 'write_log!A2:E2',
  })
  console.log('✓ Cleanup passed (cleared write_log test row)')

  console.log('\nAll checks passed. Ready to run the app!')
}

run().catch(err => {
  console.error('\n✗ Connection failed:', err.message)
  if (err.message.includes('invalid_grant')) {
    console.error('  → Refresh token is invalid or expired. Re-generate it from OAuth2 Playground.')
  } else if (err.message.includes('403')) {
    console.error('  → Permission denied. Make sure Google Sheets API is enabled in Google Cloud Console.')
  } else if (err.message.includes('404')) {
    console.error('  → Spreadsheet not found. Check your SPREADSHEET_ID.')
  }
  process.exit(1)
})
