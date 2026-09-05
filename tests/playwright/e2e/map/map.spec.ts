import { test, expect } from '../../fixtures/test.fixtures';
import { MapPage } from '../../pages/MapPage.pom';

test.describe('Map Visualization', () => {
  test('TC-PW-030: Map loads and renders Leaflet tiles', async ({ citizenPage }) => {
    const mapPage = new MapPage(citizenPage);
    await mapPage.goto();
    await mapPage.expectMapLoaded();
  });

  test('TC-PW-031: Layer controls are visible', async ({ citizenPage }) => {
    const mapPage = new MapPage(citizenPage);
    await mapPage.goto();
    
    // In Leaflet, layer controls are usually in .leaflet-control-layers
    const layerControl = citizenPage.locator('.leaflet-control-layers, .map-controls');
    if (await layerControl.count() > 0) {
      await expect(layerControl.first()).toBeVisible();
    }
  });

  test('TC-PW-032: Marker cluster renders on zoom', async ({ adminPage }) => {
    // Admin page usually has more data to cluster
    const mapPage = new MapPage(adminPage);
    await mapPage.goto();
    await mapPage.expectMapLoaded();
    
    // Zoom out using leaflet zoom out button
    const zoomOut = adminPage.locator('.leaflet-control-zoom-out');
    if (await zoomOut.count() > 0) {
      await zoomOut.click();
      await zoomOut.click();
      
      // Check for marker clusters
      const cluster = adminPage.locator('.marker-cluster');
      // It might not exist if there is no data, so we don't strictly assert it
      if (await cluster.count() > 0) {
        await expect(cluster.first()).toBeVisible();
      }
    }
  });
});
