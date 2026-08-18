import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Candidate from '../models/Candidate.js';

/**
 * Get candidate count by source
 * GET /api/candidates/analytics/sources
 */
export const getCandidatesBySource = asyncHandler(async (req, res) => {
  try {
    const sourceStats = await Candidate.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Map null sources to "Unknown"
    const data = sourceStats.map((stat) => ({
      source: stat._id || 'Unknown',
      count: stat.count,
    }));

    // Ensure all sources are represented
    const allSources = [
      'LinkedIn',
      'Indeed',
      'Naukri',
      'Referral',
      'Company Website',
      'Email',
      'Recruiter Sourcing',
      'Walk-in',
      'Other',
    ];

    const sourceMap = new Map(data.map((d) => [d.source, d.count]));
    const result = allSources
      .map((source) => ({
        source,
        count: sourceMap.get(source) || 0,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    // Add unknown sources if any
    const unknownSources = data.filter((d) => !allSources.includes(d.source));
    if (unknownSources.length > 0) {
      result.push(...unknownSources);
    }

    res.status(200).json({
      success: true,
      data: {
        sources: result,
        total: data.reduce((sum, d) => sum + d.count, 0),
      },
    });
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch source analytics');
  }
});

/**
 * Get candidate count by status
 * GET /api/candidates/analytics/statuses
 */
export const getCandidatesByStatus = asyncHandler(async (req, res) => {
  try {
    const statusStats = await Candidate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const data = statusStats.map((stat) => ({
      status: stat._id || 'Unknown',
      count: stat.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        statuses: data,
        total: data.reduce((sum, d) => sum + d.count, 0),
      },
    });
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch status analytics');
  }
});

/**
 * Get candidate statistics summary
 * GET /api/candidates/analytics/summary
 */
export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  try {
    const [totalCandidates, sourceStats, statusStats] = await Promise.all([
      Candidate.countDocuments(),
      Candidate.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
          },
        },
      ]),
      Candidate.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        sourceDistribution: sourceStats,
        statusDistribution: statusStats,
      },
    });
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch analytics summary');
  }
});

export default {
  getCandidatesBySource,
  getCandidatesByStatus,
  getAnalyticsSummary,
};
