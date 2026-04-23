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

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.SPREADSHEET_ID,
  range: 'players!A2:I',
  valueRenderOption: 'UNFORMATTED_VALUE',
})

console.log('Raw rows:', JSON.stringify(res.data.values, null, 2))
const row = res.data.values?.[0]
if (row) {
  console.log('\nis_active value:', row[8], '| type:', typeof row[8])
  console.log('is_active === true:', row[8] === true)
  console.log('is_active === "TRUE":', row[8] === 'TRUE')
}
