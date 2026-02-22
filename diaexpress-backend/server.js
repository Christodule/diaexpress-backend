const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const appConfig = require('./config/appConfig');
const { seedAdminUser } = require('./services/adminSeeder');

const app = express();

// Middleware global
const corsOrigins = appConfig.server.corsOrigins;
const corsOptions = corsOrigins.length
  ? { origin: corsOrigins, credentials: true }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());

if (appConfig.server.enableRequestLogging) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () =>
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`,
      ),
    );
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/package-types', require('./routes/packageType'));
app.use('/api/expeditions', require('./routes/expeditions'));
app.use('/api/admin/quotes', require('./routes/adminQuotes'));
app.use('/api/admin/market-points', require('./routes/marketPoints'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/addresses', require('./routes/addresses'));
app.use("/api/reservations", require('./routes/reservations'));
app.use("/api/schedules", require("./routes/Schedules"));
app.use('/api/admin', require('./routes/logisticsAdmin'));
const adminRouter = require('./routes/v1/admin');

app.use('/api/v1/admin', adminRouter);
app.use('/api/admin', adminRouter); // Legacy path for admin frontend
app.use('/api/v1/public', require('./routes/v1/public'));


app.use('/api/uploads',require('./routes/uploads') );
app.use('/uploads', express.static('uploads')); // pour servir les images

async function startServer() {
  await connectDB();
  await seedAdminUser();

  const PORT = appConfig.server.port;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer().catch((error) => {
  console.error('❌ Impossible de démarrer le serveur DiaExpress:', error);
  process.exit(1);
});
