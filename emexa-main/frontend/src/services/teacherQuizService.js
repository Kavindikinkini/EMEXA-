import api from './apiClient.js';

// API base URL for teacher quizzes
const BASE_URL = '/teacher-quizzes';

/**
 * Teacher Quiz Service
 * Handles all API calls for teacher quiz management
 */
const teacherQuizService = {
  /**
   * Create a new quiz
   * @param {Object} quizData - Quiz data including title, subject, gradeLevel, dueDate, questions
   * @returns {Promise} Response with created quiz
   */
  async createQuiz(quizData) {
    try {
      const response = await api.post(`${BASE_URL}/create`, quizData);
      return response; // apiClient returns parsed JSON already
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  /**
   * Get all quizzes for the logged-in teacher
   * @returns {Promise} Response with array of quizzes
   */
  async getMyQuizzes() {
    try {
      const response = await api.get(`${BASE_URL}/my-quizzes`);
      return response;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  /**
   * Get all draft quizzes
   * @returns {Promise} Response with array of draft quizzes
   */
  async getDrafts() {
    try {
      const response = await api.get(`${BASE_URL}/drafts`);
      return response;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw error;
    }
  },

  /**
   * Get all scheduled quizzes
   * @returns {Promise} Response with array of scheduled quizzes
   */
  async getScheduledQuizzes() {
    try {
      const response = await api.get(`${BASE_URL}/scheduled`);
      return response;
    } catch (error) {
      console.error('Error fetching scheduled quizzes:', error);
      throw error;
    }
  },

  /**
   * Get quiz statistics (total, drafts, scheduled, active, closed)
   * @returns {Promise} Response with quiz stats (total, drafts, scheduled, active, closed)
   */
  async getQuizStats() {
    try {
      const response = await api.get(`${BASE_URL}/stats`);
      return response.stats || response;
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      throw error;
    }
  },

  /**
   * Get a single quiz by ID
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Response with quiz data
   */
  async getQuizById(quizId) {
    try {
      const response = await api.get(`${BASE_URL}/${quizId}`);
      return response;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  /**
   * Update a quiz
   * @param {string} quizId - Quiz ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} Response with updated quiz
   */
  async updateQuiz(quizId, updateData) {
    try {
      const response = await api.put(`${BASE_URL}/${quizId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  /**
   * Schedule a quiz
   * @param {string} quizId - Quiz ID
   * @param {Object} scheduleData - Schedule data with scheduleDate, startTime, endTime
   * @returns {Promise} Response with scheduled quiz
   */
  async scheduleQuiz(quizId, scheduleData) {
    try {
      const response = await api.post(`${BASE_URL}/${quizId}/schedule`, scheduleData);
      return response;
    } catch (error) {
      console.error('Error scheduling quiz:', error);
      throw error;
    }
  },

  /**
   * Delete a quiz (soft delete)
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Response confirming deletion
   */
  async deleteQuiz(quizId) {
    try {
      const response = await api.delete(`${BASE_URL}/${quizId}`);
      return response;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  /**
   * Permanently delete a quiz
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Response confirming permanent deletion
   */
  async permanentDeleteQuiz(quizId) {
    try {
      const response = await api.delete(`${BASE_URL}/${quizId}/permanent`);
      return response;
    } catch (error) {
      console.error('Error permanently deleting quiz:', error);
      throw error;
    }
  },

  /**
   * Get all shared quizzes (public - for students)
   * @returns {Promise} Response with array of shared quizzes
   */
  async getSharedQuizzes() {
    try {
      const response = await api.get(`${BASE_URL}/shared`);
      return response;
    } catch (error) {
      console.error('Error fetching shared quizzes:', error);
      throw error;
    }
  }
};

export default teacherQuizService;
