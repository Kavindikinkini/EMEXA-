-- Teacher Dashboard Database Schema
-- Run this script to create the necessary tables for teacher dashboard functionality
-- Teacher-Student relationship table
CREATE TABLE IF NOT EXISTS teacher_students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    class_id INT,
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_student (teacher_id, student_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_date (student_id, attendance_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Student progress tracking table
CREATE TABLE IF NOT EXISTS student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_progress (student_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Student engagement tracking table
CREATE TABLE IF NOT EXISTS student_engagement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    engagement_score INT DEFAULT 0,
    week_start DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_date (student_id, date),
    INDEX idx_week_start (week_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Weekly progress tracking table
CREATE TABLE IF NOT EXISTS weekly_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT,
    week_start DATE NOT NULL,
    completed_percentage DECIMAL(5, 2) DEFAULT 0.00,
    target_percentage DECIMAL(5, 2) DEFAULT 80.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_class_week (class_id, week_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Emotional state tracking table
CREATE TABLE IF NOT EXISTS emotional_state (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    emotion_type ENUM('happy', 'confused', 'frustrated', 'neutral') NOT NULL,
    recorded_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_date (student_id, recorded_date),
    INDEX idx_emotion (emotion_type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATETIME,
    total_marks INT DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher_created (teacher_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Quiz submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    score DECIMAL(5, 2),
    submitted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_quiz_student (quiz_id, student_id),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Add profile_image column to users table if not exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL;
-- Insert sample data for testing (optional)
-- You can uncomment and modify these based on your existing data
-- INSERT INTO teacher_students (teacher_id, student_id, class_id) VALUES
-- (1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1);
-- INSERT INTO student_progress (student_id, progress_percentage) VALUES
-- (1, 92), (2, 88), (3, 95), (4, 85);
-- INSERT INTO student_engagement (student_id, date, engagement_score, week_start) VALUES
-- (1, CURDATE(), 85, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
-- (2, CURDATE(), 75, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
-- (3, CURDATE(), 90, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
-- (4, CURDATE(), 80, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY));
-- INSERT INTO emotional_state (student_id, emotion_type, recorded_date) VALUES
-- (1, 'happy', CURDATE()), (2, 'confused', CURDATE()),
-- (3, 'happy', CURDATE()), (4, 'neutral', CURDATE());
-- INSERT INTO attendance (student_id, attendance_date, status) VALUES
-- (1, CURDATE(), 'present'), (2, CURDATE(), 'present'),
-- (3, CURDATE(), 'absent'), (4, CURDATE(), 'present');