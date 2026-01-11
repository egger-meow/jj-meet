const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const ReportService = require('../../../src/services/report.service');

describe('ReportService', () => {
  let db;
  let testUser1, testUser2;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    testUser1 = await createTestUser(db);
    testUser2 = await createTestUser(db);
  });

  describe('createReport', () => {
    it('should create a report successfully', async () => {
      const report = await ReportService.createReport(
        testUser1.id,
        testUser2.id,
        'harassment',
        'They sent inappropriate messages'
      );

      expect(report).toBeDefined();
      expect(report.reporter_id).toBe(testUser1.id);
      expect(report.reported_id).toBe(testUser2.id);
      expect(report.reason).toBe('harassment');
      expect(report.status).toBe('pending');
    });

    it('should throw error when reporting self', async () => {
      await expect(
        ReportService.createReport(testUser1.id, testUser1.id, 'spam')
      ).rejects.toThrow('Cannot report yourself');
    });

    it('should throw error for invalid reason', async () => {
      await expect(
        ReportService.createReport(testUser1.id, testUser2.id, 'invalid_reason')
      ).rejects.toThrow('Invalid report reason');
    });

    it('should throw error for duplicate pending report', async () => {
      await ReportService.createReport(testUser1.id, testUser2.id, 'spam');

      await expect(
        ReportService.createReport(testUser1.id, testUser2.id, 'harassment')
      ).rejects.toThrow('You already have a pending report for this user');
    });
  });

  describe('getUserReports', () => {
    it('should return user reports', async () => {
      await ReportService.createReport(testUser1.id, testUser2.id, 'spam');

      const reports = await ReportService.getUserReports(testUser1.id);

      expect(reports).toHaveLength(1);
      expect(reports[0].reported_id).toBe(testUser2.id);
    });

    it('should return empty array when no reports', async () => {
      const reports = await ReportService.getUserReports(testUser1.id);
      expect(reports).toHaveLength(0);
    });
  });

  describe('updateReportStatus', () => {
    it('should update report status', async () => {
      const report = await ReportService.createReport(
        testUser1.id,
        testUser2.id,
        'harassment'
      );

      const updated = await ReportService.updateReportStatus(
        report.id,
        testUser1.id,
        'resolved',
        'Verified harassment',
        'warning'
      );

      expect(updated.status).toBe('resolved');
      expect(updated.admin_notes).toBe('Verified harassment');
      expect(updated.action_taken).toBe('warning');
      expect(updated.reviewed_by).toBe(testUser1.id);
    });

    it('should throw error for invalid status', async () => {
      const report = await ReportService.createReport(
        testUser1.id,
        testUser2.id,
        'spam'
      );

      await expect(
        ReportService.updateReportStatus(report.id, testUser1.id, 'invalid_status')
      ).rejects.toThrow('Invalid report status');
    });
  });

  describe('getReportReasons', () => {
    it('should return valid report reasons', () => {
      const reasons = ReportService.getReportReasons();

      expect(reasons).toContain('harassment');
      expect(reasons).toContain('spam');
      expect(reasons).toContain('fake_profile');
    });
  });

  describe('getReportCount', () => {
    it('should return report count for user', async () => {
      await ReportService.createReport(testUser1.id, testUser2.id, 'spam');

      const count = await ReportService.getReportCount(testUser2.id);
      expect(count).toBe(1);
    });

    it('should return 0 when no reports', async () => {
      const count = await ReportService.getReportCount(testUser2.id);
      expect(count).toBe(0);
    });
  });
});
