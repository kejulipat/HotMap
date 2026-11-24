import test from "node:test";
import assert from "node:assert/strict";
import {
  BASEMAP_LAYERS,
  formatCoordinates,
  getGoogleMapsUrl,
  getOsmUrl,
  isSentinelZeroCoordinate,
  isValidCoordinatePair,
  isWithinIndonesiaBounds,
} from "../src/lib/gis.js";

test("isValidCoordinatePair validates finite lat/lng bounds", () => {
  assert.equal(isValidCoordinatePair(-2.2136, 113.9108), true);
  assert.equal(isValidCoordinatePair(90, 180), true);
  assert.equal(isValidCoordinatePair(-90, -180), true);
  assert.equal(isValidCoordinatePair(91, 110), false);
  assert.equal(isValidCoordinatePair(-2, 181), false);
  assert.equal(isValidCoordinatePair(NaN, 110), false);
  assert.equal(isValidCoordinatePair("-2.2", "113.9"), false);
  assert.equal(isValidCoordinatePair(null, null), false);
});

test("isSentinelZeroCoordinate detects (0,0)", () => {
  assert.equal(isSentinelZeroCoordinate(0, 0), true);
  assert.equal(isSentinelZeroCoordinate(0.0001, 0), false);
  assert.equal(isSentinelZeroCoordinate(-2.2, 113.9), false);
});

test("isWithinIndonesiaBounds accepts Indonesian points and rejects foreign points", () => {
  // Riau, Palangka Raya, Merauke
  assert.equal(isWithinIndonesiaBounds(0.2082, 102.1654), true);
  assert.equal(isWithinIndonesiaBounds(-2.2136, 113.9108), true);
  assert.equal(isWithinIndonesiaBounds(-8.4932, 140.4018), true);
  // Tokyo, London, Sydney, (0,0)
  assert.equal(isWithinIndonesiaBounds(35.6762, 139.6503), false);
  assert.equal(isWithinIndonesiaBounds(51.5072, -0.1276), false);
  assert.equal(isWithinIndonesiaBounds(-33.8688, 151.2093), false);
  assert.equal(isWithinIndonesiaBounds(0, 0), false);
});

test("formatCoordinates and external map URLs work safely", () => {
  assert.equal(formatCoordinates(-2.2136123, 113.9108456, 4), "-2.2136, 113.9108");
  assert.equal(formatCoordinates(null, 113.9), "-");
  assert.match(getGoogleMapsUrl(-2.2136, 113.9108), /^https:\/\/www\.google\.com\/maps\?q=/);
  assert.match(getOsmUrl(-2.2136, 113.9108), /^https:\/\/www\.openstreetmap\.org\/\?mlat=/);
  assert.equal(getGoogleMapsUrl(999, 113.9), null);
  assert.equal(Object.keys(BASEMAP_LAYERS).length, 3);
});
