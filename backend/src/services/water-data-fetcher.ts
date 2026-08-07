import cron from 'node-cron';
import { simulateDataFetch } from './data-simulator';
import { evaluateThresholdsAndAlerts } from './alert-generator';
import { reevaluateIncidentPriorities } from './priority_escalator';
import { getIO } from '../utils/socketInstance';

export function setupWaterDataCron() {
  console.log('Setting up water data cron job (running at :00 every hour)');

  cron.schedule('0 * * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Initiating hourly water data fetch...`);

      // Step 1: Fetch/Simulate Data
      await simulateDataFetch();

      // Step 2: Evaluate Thresholds & Suggest Alerts
      await evaluateThresholdsAndAlerts();

      // Step 3: Re-evaluate Incidents
      await reevaluateIncidentPriorities();

      // Step 4: Notify all clients subscribed to the /water namespace
      // so WaterMonitorPage refreshes automatically without polling
      const io = getIO();
      io.of('/water').emit('water_data_updated', { timestamp: new Date().toISOString() });
      io.emit('water_data_updated', { timestamp: new Date().toISOString() });

      console.log('Hourly water data fetch pipeline completed successfully.');
    } catch (error) {
      console.error('Error during hourly water data fetch pipeline:', error);
    }
  });
}
