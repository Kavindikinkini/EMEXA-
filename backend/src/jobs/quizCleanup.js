import cron from 'node-cron';
import { TeacherQuiz } from '../models/teacherQuiz.js';

/**
 * Cleanup job that runs daily at midnight to remove expired quizzes
 * Quizzes are removed 1 month after their end time
 */
export const startQuizCleanupJob = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running quiz cleanup job...');
    
    try {
      const result = await TeacherQuiz.cleanupExpiredQuizzes();
      
      if (result.success) {
        console.log(`Quiz cleanup completed: ${result.count} quizzes removed`);
        
        // If you have a Notification model, clean up related notifications
        if (result.quizIds && result.quizIds.length > 0) {
          // Import your Notification model here
          // await Notification.deleteMany({ quizId: { $in: result.quizIds } });
        }
      } else {
        console.error('Quiz cleanup failed:', result.error);
      }
    } catch (error) {
      console.error('Error in quiz cleanup job:', error);
    }
  });
  
  console.log('Quiz cleanup job scheduled (runs daily at midnight)');
};

/**
 * Manual cleanup function that can be called on-demand
 */
export const runManualCleanup = async () => {
  console.log('Running manual quiz cleanup...');
  return await TeacherQuiz.cleanupExpiredQuizzes();
};
