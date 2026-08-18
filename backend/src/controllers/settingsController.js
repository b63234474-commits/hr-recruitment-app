import Settings from '../models/Settings.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { DEFAULT_SETTINGS, normalizeSettings } from '../config/defaultSettings.js';

const ensureSettingsDoc = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(normalizeSettings(DEFAULT_SETTINGS));
  }
  return settings;
};

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await ensureSettingsDoc();

  res.status(200).json({
    success: true,
    data: { settings },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await ensureSettingsDoc();
  const incoming = req.body || {};

  if (incoming.ats) {
    const { skillWeight = 0, experienceWeight = 0, educationWeight = 0, locationWeight = 0 } = incoming.ats;
    const total = Number(skillWeight) + Number(experienceWeight) + Number(educationWeight) + Number(locationWeight);
    if (total && total !== 100) {
      throw new ApiError(400, 'ATS weight fields must total 100%');
    }
  }

  const merged = normalizeSettings(settings.toObject());
  const nextSettings = normalizeSettings({ ...merged, ...incoming });

  Object.assign(settings, nextSettings);
  await settings.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: { settings },
  });
});
