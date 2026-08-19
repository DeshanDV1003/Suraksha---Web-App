import cron from 'node-cron';
import { fetchAndStoreDistrictRainfall } from './rainfallWeatherService';

/**
 * Runs every 30 minutes, independent of the existing hourly water-data cron.
 * Fetches real rainfall from Open-Meteo and stores in RainfallReading.
 */
export function setupRainfallWeatherCron(): void {
  console.log('[RainfallWeather] Cron registered — runs every 30 minutes.');

  // Delay startup fetch by 5s to let Prisma connection pool warm up
  setTimeout(() => {
    fetchAndStoreDistrictRainfall().catch(err =>
      console.error('[RainfallWeather] Startup fetch failed:', err)
    );
  }, 5000);

  // Then every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await fetchAndStoreDistrictRainfall();
    } catch (err) {
      console.error('[RainfallWeather] Cron run failed:', err);
    }
  });
}
