const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// 📌 قاعدة البيانات
const db = new sqlite3.Database("purchases.db");

// 📌 إنشاء الجدول إذا ماكانش
db.run(`
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId TEXT,
    productId TEXT,
    date INTEGER
  )
`);

const BLOCK_TIME = 180 * 24 * 60 * 60 * 1000; // 6 شهور بالميلي ثانية

// ✅ Route رئيسي باش ما يبانش Cannot GET /
app.get("/", (req, res) => {
  res.send("🚀 Server is running on Render!");
});

// ✅ API : نتأكدو إذا يقدر يشري
app.get("/can-purchase", (req, res) => {
  const { customerId, productId } = req.query;

  db.get(
    "SELECT date FROM purchases WHERE customerId = ? AND productId = ? ORDER BY date DESC LIMIT 1",
    [customerId, productId],
    (err, row) => {
      if (err) return res.status(500).json({ ok: false, msg: "⚠️ خطأ في السيرفر" });

      if (!row) {
        return res.json({ ok: true, msg: "✅ تقدر تشري عادي" });
      }

      const lastPurchase = row.date;
      const now = Date.now();

      if (now - lastPurchase < BLOCK_TIME) {
        const remainingDays = Math.ceil((BLOCK_TIME - (now - lastPurchase)) / (24 * 60 * 60 * 1000));
        return res.json({ ok: false, msg: `🚫 سبق لك شريت هذا المنتوج، استنى ${remainingDays} يوم` });
      }

      res.json({ ok: true, msg: "✅ تقدر تشري عادي" });
    }
  );
});

// ✅ API : تسجيل طلبية جديدة
app.post("/order", (req, res) => {
  const { customerId, productId } = req.body;
  const now = Date.now();

  db.run(
    "INSERT INTO purchases (customerId, productId, date) VALUES (?, ?, ?)",
    [customerId, productId, now],
    (err) => {
      if (err) return res.status(500).json({ ok: false, msg: "⚠️ ماقدرناش نسجلو الطلبية" });
      res.json({ ok: true, msg: "✅ تسجلات الطلبية" });
    }
  );
});

// ✅ نطلقو السيرفر على PORT تاع Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر راهو يخدم في http://localhost:${PORT}`);
});
