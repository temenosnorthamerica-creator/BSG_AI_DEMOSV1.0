import express from 'express';
import cors from 'cors';
import { sampleEventsRouter } from './routes/sampleEvents.js';
import { sampleApisRouter } from './routes/sampleApis.js';
import { configurationsRouter } from './routes/configurations.js';
import { demoRouter } from './routes/demo.js';
import { eventHubConfigRouter } from './routes/eventHubConfig.js';
import { formGeneratorRouter } from './routes/formGenerator.js';
import { offsetsRouter } from './routes/offsets.js';
import { variablesRouter } from './routes/variables.js';
import { environmentVariablesRouter } from './routes/environmentVariables.js';
import { apiHistoryRouter } from './routes/apiHistory.js';
import { sampleFilesRouter } from './routes/sampleFiles.js';
import { csvProcessingRouter } from './routes/csvProcessing.js';
import formSettingsRouter from './routes/formSettings.js';
import { monitorRouter } from './routes/monitor.js';

const app = express();
const PORT = process.env.PORT || 8006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/sample-events', sampleEventsRouter);
app.use('/api/sample-apis', sampleApisRouter);
app.use('/api/configurations', configurationsRouter);
app.use('/api/demo', demoRouter);
app.use('/api/event-hub-config', eventHubConfigRouter);
app.use('/api/form-generator', formGeneratorRouter);
app.use('/api/offsets', offsetsRouter);
app.use('/api/variables', variablesRouter);
app.use('/api/environment-variables', environmentVariablesRouter);
app.use('/api/api-history', apiHistoryRouter);
app.use('/api/sample-files', sampleFilesRouter);
app.use('/api/csv-processing', csvProcessingRouter);
app.use('/api/form-settings', formSettingsRouter);
app.use('/api/monitor', monitorRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ESB Backend Server running on port ${PORT}`);
});
