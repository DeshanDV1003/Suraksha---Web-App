import cron from 'node-cron';
import { simulateDataFetch } from './data-simulator';
import { evaluateThresholdsAndAlerts } from './alert-generator';
import { reevaluateIncidentPriorities } from './priority_escalator';
// import { io } from '../index'; // Assuming socket.io is exported from index

export function setupWaterDataCron() {
  console.log('Setting up water data cron job (running at :00 every hour)');

  // Run at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Initiating hourly water data fetch...`);
      
      // Step 1: Fetch/Simulate Data
      await simulateDataFetch();

      // Step 2: Evaluate Thresholds & Suggest Alerts
      await evaluateThresholdsAndAlerts();

      // Step 3: Re-evaluate Incidents
      await reevaluateIncidentPriorities();

      // Step 4: Notify clients
      // io.of('/water').emit('water_data_updated', { timestamp: new Date() });
      console.log('Hourly water data fetch pipeline completed successfully.');
    } catch (error) {
      console.error('Error during hourly water data fetch pipeline:', error);
      // In a real scenario, we'd implement retry logic here (e.g., set timeouts for 10 and 20 mins)
    }
  });
}
