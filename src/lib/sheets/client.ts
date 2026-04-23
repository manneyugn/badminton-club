import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function createAuthClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return auth
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: createAuthClient() })
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const isRateLimit =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: number }).code === 429
      if (isRateLimit && i < retries - 1) {
        await new Promise(r => setTimeout(r, (i + 1) * 1000))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export async function getValues(range: string): Promise<(string | number | boolean)[][]> {
  const sheets = getSheetsClient()
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    })
  )
  return (res.data.values as (string | number | boolean)[][]) ?? []
}

export async function appendValues(range: string, values: (string | number | boolean)[][]): Promise<void> {
  const sheets = getSheetsClient()
  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    })
  )
}

export async function updateValues(range: string, values: (string | number | boolean)[][]): Promise<void> {
  const sheets = getSheetsClient()
  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })
  )
}

export async function batchUpdateValues(
  data: { range: string; values: (string | number | boolean)[][] }[]
): Promise<void> {
  const sheets = getSheetsClient()
  await withRetry(() =>
    sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data,
      },
    })
  )
}
