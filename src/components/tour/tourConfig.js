// Tour configurations for different roles and pages

export const teacherDashboardTour = [
  {
    element: '.nav-container',
    intro: 'tour.teacherWelcome',
    position: 'bottom'
  },
  {
    element: '.dashboard-stats, .teacher-dashboard-container',
    intro: 'tour.teacherDashboard',
    position: 'bottom'
  },
  {
    element: '.gear, .nav-right-side',
    intro: 'tour.teacherProfile',
    position: 'left'
  }
];

export const teacherQuestionPageTour = [
  {
    element: '.question-container',
    intro: 'tour.teacherCreateAssignment',
    position: 'bottom'
  },
  {
    element: '.question-pocket',
    intro: 'tour.teacherQuestionPocket',
    position: 'left'
  },
  {
    element: '.add-question-btn, .question-form',
    intro: 'tour.teacherCreateAssignment',
    position: 'right'
  }
];

export const studentDashboardTour = [
  {
    element: '.nav-container',
    intro: 'tour.studentWelcome',
    position: 'bottom'
  },
  {
    element: '.student-dashboard-container, .assignment-list',
    intro: 'tour.studentDashboard',
    position: 'bottom'
  },
  {
    element: '.assignment-card, .assignment-item',
    intro: 'tour.studentAssignments',
    position: 'right'
  },
  {
    element: '.gear, .nav-right-side',
    intro: 'tour.studentProfile',
    position: 'left'
  }
];

export const studentAssignmentTour = [
  {
    element: '.question-form-head',
    intro: 'tour.studentStartExam',
    position: 'bottom'
  },
  {
    element: '.abacus-button',
    intro: 'tour.studentAbacus',
    position: 'bottom'
  },
  {
    element: '.flash-mode-button',
    intro: 'tour.studentFlashMode',
    position: 'bottom'
  },
  {
    element: '.keyboard-container, .answer-input-container',
    intro: 'tour.studentKeyboard',
    position: 'top'
  },
  {
    element: '.toggle-btn',
    intro: 'tour.studentKeyboard',
    position: 'top'
  },
  {
    element: '.question-end-btn, .question-form-btn',
    intro: 'tour.studentResults',
    position: 'top'
  }
];

// Helper function to check if tour should be shown
export const shouldShowTour = (role, page) => {
  const tourKey = `hasSeenTour_${role}_${page}`;
  return !localStorage.getItem(tourKey);
};

// Helper function to mark tour as completed
export const completeTour = (role, page) => {
  const tourKey = `hasSeenTour_${role}_${page}`;
  localStorage.setItem(tourKey, 'true');
};

// Helper function to reset tour (for help button)
export const resetTour = (role, page) => {
  const tourKey = `hasSeenTour_${role}_${page}`;
  localStorage.removeItem(tourKey);
};

// Helper function to reset all tours
export const resetAllTours = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('hasSeenTour_')) {
      localStorage.removeItem(key);
    }
  });
};
