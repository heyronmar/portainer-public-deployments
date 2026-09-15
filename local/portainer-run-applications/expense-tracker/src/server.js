require('dotenv').config()
const express = require('express')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const APP_TITLE = process.env.APP_TITLE || 'Expense Tracker'
const CURRENCY = process.env.CURRENCY || 'USD'

const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'expenses.db'))
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/config', (req, res) =>
  res.json({ title: APP_TITLE, currency: CURRENCY }))

app.get('/api/expenses', (req, res) =>
  res.json(db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all()))

app.post('/api/expenses', (req, res) => {
  const { description, amount, category } = req.body
  if (!description || !amount || !category)
    return res.status(400).json({ error: 'All fields required' })
  const r = db.prepare('INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)').run(description, Number(amount), category)
  res.json({ id: r.lastInsertRowid, description, amount: Number(amount), category })
})

app.delete('/api/expenses/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.get('/api/summary', (req, res) => {
  const total = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM expenses').get().t
  const byCategory = db.prepare('SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC').all()
  res.json({ total, byCategory })
})

app.listen(PORT, () => console.log(`${APP_TITLE} on port ${PORT}`))
