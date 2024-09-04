const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'asset_library',
  password: 'mysecretpassword',
  port: 5433,
});

app.get('/search', async (req, res) => {
  const searchTerm = req.query.q || '';
  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term is required' });
  }

  try {
    // Use LIKE operator with wildcards for substring matching
    const searchQuery = `
      SELECT 
          at.name AS asset_type,
          a.name AS asset_name,
          af.field_name,
          af.field_value
      FROM 
          asset_type at
      JOIN 
          assets a ON a.asset_type_id = at.id
      JOIN 
          asset_fields af ON a.id = af.asset_id
      WHERE 
          at.name ILIKE '%' || $1 || '%'
          OR a.name ILIKE '%' || $1 || '%'
          OR af.field_name ILIKE '%' || $1 || '%'
          OR af.field_value ILIKE '%' || $1 || '%'
      ORDER BY 
          at.name, a.name
      LIMIT 50;
    `;

    const { rows } = await pool.query(searchQuery, [searchTerm]);
    
    // Structure results by asset_type
    const results = rows.reduce((acc, row) => {
      if (!acc[row.asset_type]) {
        acc[row.asset_type] = {};
      }
      if (!acc[row.asset_type][row.asset_name]) {
        acc[row.asset_type][row.asset_name] = [];
      }
      acc[row.asset_type][row.asset_name].push({
        field_name: row.field_name,
        field_value: row.field_value
      });
      return acc;
    }, {});

    res.json(results);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
