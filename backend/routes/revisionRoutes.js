import express from 'express';
import User from '../models/User';
const express = require('express');
const router = express.Router();
const RevisionController = require('../controllers/TaskController');
const auth = require('../middleware/auth');

const revisionController = new RevisionController();

// Lecturer routes
router.post(
    '/tasks/:taskId/request-revision',
    auth.requireLecturer,
    revisionController.requestRevision
);

// Student routes
router.post(
    '/tasks/:taskId/submit-revision',
    auth.requireStudent,
    revisionController.submitRevision
);

// Common routes
router.get(
    '/tasks/:taskId/revisions',
    auth.requireAuth,
    revisionController.getRevisionHistory
);

router.get(
    '/revisions/compare/:revisionId1/:revisionId2',
    auth.requireAuth,
    revisionController.compareRevisions
);

export default router;