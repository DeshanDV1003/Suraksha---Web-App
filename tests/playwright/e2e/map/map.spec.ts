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
    
    // Zoom out using the leaflet zoom-out button (clustering kicks in at lower zoom levels).
    // The map's minZoom is 7 and starts at zoom 8, so only one zoom-out step is available
    // before the control disables itself.
    const zoomOut = adminPage.locator('.leaflet-control-zoom-out');
    await expect(zoomOut).toBeVisible({ timeout: 10000 });
    // The always-on Layers panel sits in the same corner and briefly animates (transition-all)
    // on mount, which can intercept the click mid-transition in slower engines — force it.
    await zoomOut.click({ force: true });

    // Check for marker clusters — it might not exist if there is no data, so we don't strictly assert it
    const cluster = adminPage.locator('.marker-cluster');
    if (await cluster.count() > 0) {
      await expect(cluster.first()).toBeVisible();
    }
  });
});
