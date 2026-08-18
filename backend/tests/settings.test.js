import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/config/defaultSettings.js';

test('default settings include core ATS and recruitment values', () => {
  assert.ok(DEFAULT_SETTINGS.general?.companyName, 'companyName should exist');
  assert.ok(DEFAULT_SETTINGS.ats?.skillWeight, 'ats.skillWeight should exist');
  assert.ok(DEFAULT_SETTINGS.recruitment?.autoAssignCandidateStatus, 'recruitment auto assignment should exist');
  assert.equal(DEFAULT_SETTINGS.ats.skillWeight + DEFAULT_SETTINGS.ats.experienceWeight + DEFAULT_SETTINGS.ats.educationWeight + DEFAULT_SETTINGS.ats.locationWeight, 100);
});
