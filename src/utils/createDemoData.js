// Utility to create demo data for trial teachers

export const createDemoClasses = () => {
  const demoClasses = [
    {
      _id: 'demo-class-1',
      className: 'Grade 3 - Math Heroes',
      numberOfStudent: 5,
      isDemoClass: true
    },
    {
      _id: 'demo-class-2',
      className: 'Grade 4 - Abacus Masters',
      numberOfStudent: 6,
      isDemoClass: true
    },
    {
      _id: 'demo-class-3',
      className: 'Grade 5 - Quick Thinkers',
      numberOfStudent: 4,
      isDemoClass: true
    },
    {
      _id: 'demo-class-4',
      className: 'Advanced - Mental Math',
      numberOfStudent: 5,
      isDemoClass: true
    },
    {
      _id: 'demo-class-5',
      className: 'Beginner - Numbers Fun',
      numberOfStudent: 7,
      isDemoClass: true
    }
  ];

  return demoClasses;
};

export const createDemoStudents = (classId) => {
  const studentNames = {
    'demo-class-1': [
      { name: 'Ahmed Hassan', email: 'ahmed.demo@trial.com', _id: 'demo-student-1-1' },
      { name: 'Sara Mohamed', email: 'sara.demo@trial.com', _id: 'demo-student-1-2' },
      { name: 'Omar Ali', email: 'omar.demo@trial.com', _id: 'demo-student-1-3' },
      { name: 'Fatima Khan', email: 'fatima.demo@trial.com', _id: 'demo-student-1-4' },
      { name: 'Youssef Ibrahim', email: 'youssef.demo@trial.com', _id: 'demo-student-1-5' }
    ],
    'demo-class-2': [
      { name: 'Layla Ahmed', email: 'layla.demo@trial.com', _id: 'demo-student-2-1' },
      { name: 'Karim Said', email: 'karim.demo@trial.com', _id: 'demo-student-2-2' },
      { name: 'Nour Hassan', email: 'nour.demo@trial.com', _id: 'demo-student-2-3' },
      { name: 'Zain Malik', email: 'zain.demo@trial.com', _id: 'demo-student-2-4' },
      { name: 'Hana Ali', email: 'hana.demo@trial.com', _id: 'demo-student-2-5' },
      { name: 'Amir Farouk', email: 'amir.demo@trial.com', _id: 'demo-student-2-6' }
    ],
    'demo-class-3': [
      { name: 'Maryam Tariq', email: 'maryam.demo@trial.com', _id: 'demo-student-3-1' },
      { name: 'Rami Nabil', email: 'rami.demo@trial.com', _id: 'demo-student-3-2' },
      { name: 'Salma Omar', email: 'salma.demo@trial.com', _id: 'demo-student-3-3' },
      { name: 'Tarek Youssef', email: 'tarek.demo@trial.com', _id: 'demo-student-3-4' }
    ],
    'demo-class-4': [
      { name: 'Dina Mahmoud', email: 'dina.demo@trial.com', _id: 'demo-student-4-1' },
      { name: 'Khaled Ahmed', email: 'khaled.demo@trial.com', _id: 'demo-student-4-2' },
      { name: 'Yasmin Samir', email: 'yasmin.demo@trial.com', _id: 'demo-student-4-3' },
      { name: 'Amr Hassan', email: 'amr.demo@trial.com', _id: 'demo-student-4-4' },
      { name: 'Rana Waleed', email: 'rana.demo@trial.com', _id: 'demo-student-4-5' }
    ],
    'demo-class-5': [
      { name: 'Ali Mostafa', email: 'ali.demo@trial.com', _id: 'demo-student-5-1' },
      { name: 'Nada Fathi', email: 'nada.demo@trial.com', _id: 'demo-student-5-2' },
      { name: 'Hassan Tamer', email: 'hassan.demo@trial.com', _id: 'demo-student-5-3' },
      { name: 'Lina Adel', email: 'lina.demo@trial.com', _id: 'demo-student-5-4' },
      { name: 'Sami Reda', email: 'sami.demo@trial.com', _id: 'demo-student-5-5' },
      { name: 'Jana Sherif', email: 'jana.demo@trial.com', _id: 'demo-student-5-6' },
      { name: 'Mahmoud Gamal', email: 'mahmoud.demo@trial.com', _id: 'demo-student-5-7' }
    ]
  };

  return studentNames[classId] || [];
};

export const createDemoAssignments = () => {
  return [
    {
      _id: 'demo-assignment-1',
      title: 'Addition Practice - Week 1',
      totalPoints: 50,
      questions: [
        { questionText: '5 + 3 = ?', correctAnswer: '8', questionPoints: 10 },
        { questionText: '12 + 7 = ?', correctAnswer: '19', questionPoints: 10 },
        { questionText: '25 + 15 = ?', correctAnswer: '40', questionPoints: 15 },
        { questionText: '48 + 32 = ?', correctAnswer: '80', questionPoints: 15 }
      ],
      students: ['demo-student-1-1', 'demo-student-1-2', 'demo-student-1-3'],
      isDemoAssignment: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'demo-assignment-2',
      title: 'Subtraction Challenge',
      totalPoints: 60,
      questions: [
        { questionText: '15 - 8 = ?', correctAnswer: '7', questionPoints: 15 },
        { questionText: '30 - 12 = ?', correctAnswer: '18', questionPoints: 15 },
        { questionText: '45 - 19 = ?', correctAnswer: '26', questionPoints: 15 },
        { questionText: '60 - 35 = ?', correctAnswer: '25', questionPoints: 15 }
      ],
      students: ['demo-student-2-1', 'demo-student-2-2', 'demo-student-2-3', 'demo-student-2-4'],
      isDemoAssignment: true,
      createdAt: new Date().toISOString()
    }
  ];
};

export const initializeDemoData = () => {
  const demoData = {
    classes: createDemoClasses(),
    assignments: createDemoAssignments(),
    initialized: true,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('demo_data', JSON.stringify(demoData));
  return demoData;
};

export const getDemoData = () => {
  const stored = localStorage.getItem('demo_data');
  if (stored) {
    return JSON.parse(stored);
  }
  return initializeDemoData();
};

export const isDemoMode = () => {
  return localStorage.getItem('isTrialMode') === 'true';
};
