import CandidateActivity from '../models/CandidateActivity.js';
import ApiError from './ApiError.js';

/**
 * Create a candidate activity
 * @param {Object} params - Activity parameters
 * @param {string} params.candidateId - Candidate ID
 * @param {string} params.type - Activity type
 * @param {string} params.title - Activity title
 * @param {string} params.description - Activity description
 * @param {string} params.performedBy - User ID who performed the action
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Created activity
 */
export const createActivity = async ({
  candidateId,
  type,
  title,
  description = '',
  performedBy = null,
  metadata = {},
}) => {
  try {
    const activity = await CandidateActivity.create({
      candidateId,
      type,
      title,
      description,
      performedBy,
      metadata,
    });

    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    // Don't throw error - activity logging should not break the main operation
    return null;
  }
};

/**
 * Get activities for a candidate with pagination
 * @param {string} candidateId - Candidate ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} type - Optional activity type filter
 * @returns {Promise<Object>} Activities and pagination info
 */
export const getCandidateActivities = async (
  candidateId,
  page = 1,
  limit = 20,
  type = null
) => {
  try {
    const query = { candidateId };
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      CandidateActivity.find(query)
        .populate('performedBy', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CandidateActivity.countDocuments(query),
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw new ApiError(500, 'Failed to fetch activities');
  }
};

/**
 * Get activity summary for dashboard
 * @returns {Promise<Object>} Activity counts by type
 */
export const getActivitySummary = async () => {
  try {
    const summary = await CandidateActivity.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return summary;
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return [];
  }
};

export default {
  createActivity,
  getCandidateActivities,
  getActivitySummary,
};
