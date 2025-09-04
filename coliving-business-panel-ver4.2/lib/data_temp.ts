// This is a replacement file to update all dates to August 1-13, 2025

export interface Tenant {
  id: string;
  name: string;
  age: number;
  gender: string;
  property: string;
  bigFivePersonality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  role: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderType: 'tenant' | 'agent';
  content: string;
  timestamp: Date;
  sentiment: number; // -3 to +3
  emotions: string[];
  emotionScores: { [emotion: string]: number }; // 0-1 intensity scores
}

export interface Ticket {
  id: string;
  tenantId: string;
  agentIds: string[];
  status: 'In Progress' | 'Solved';
  sentiment: string;
  emotions: string[];
  topics: string[];
  summary: string;
  messages: Message[];
  lastUpdated: Date;
  startedAt: Date;
}

export const sentimentLevels = [
  'strong negative',
  'moderate negative', 
  'weak negative',
  'neutral',
  'weak positive',
  'moderate positive',
  'strong positive'
];

export const emotionTypes = [
  'anger', 'surprise', 'disgust', 'enjoyment', 'fear', 'sadness', 'neutral'
];

export const topicTypes = [
  'Billing', 'Maintenance', 'Amenities', 'Noise', 'Cleaning'
];

export const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    age: 28,
    gender: 'Female',
    property: 'Sunset Towers Apt 4B',
    bigFivePersonality: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.6,
      agreeableness: 0.9,
      neuroticism: 0.3
    }
  },
  {
    id: '2', 
    name: 'Brian Lee',
    age: 35,
    gender: 'Male',
    property: 'Marina View Unit 12A',
    bigFivePersonality: {
      openness: 0.5,
      conscientiousness: 0.9,
      extraversion: 0.4,
      agreeableness: 0.6,
      neuroticism: 0.7
    }
  },
  {
    id: '3',
    name: 'Clara Fernandez', 
    age: 42,
    gender: 'Female',
    property: 'Garden Court House 7',
    bigFivePersonality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.8,
      agreeableness: 0.7,
      neuroticism: 0.2
    }
  },
  {
    id: '4',
    name: 'David Chen',
    age: 31,
    gender: 'Male',
    property: 'Riverside Plaza Unit 8C',
    bigFivePersonality: {
      openness: 0.9,
      conscientiousness: 0.6,
      extraversion: 0.7,
      agreeableness: 0.8,
      neuroticism: 0.4
    }
  },
  {
    id: '5',
    name: 'Emma Rodriguez',
    age: 26,
    gender: 'Female',
    property: 'Skyline Heights Apt 15F',
    bigFivePersonality: {
      openness: 0.6,
      conscientiousness: 0.8,
      extraversion: 0.9,
      agreeableness: 0.8,
      neuroticism: 0.3
    }
  },
  {
    id: '6',
    name: 'Frank Miller',
    age: 45,
    gender: 'Male',
    property: 'Downtown Lofts Unit 3A',
    bigFivePersonality: {
      openness: 0.4,
      conscientiousness: 0.9,
      extraversion: 0.3,
      agreeableness: 0.5,
      neuroticism: 0.8
    }
  }
];

export const mockAgents: Agent[] = [
  { id: '1', name: 'Sarah', role: 'Customer Service' },
  { id: '2', name: 'Tom', role: 'Sales' },
  { id: '3', name: 'Mia', role: 'Customer Service' },
  { id: '4', name: 'Jake', role: 'Maintenance' },
  { id: '5', name: 'Lisa', role: 'Customer Service' }
];

export const mockTickets: Ticket[] = [
  {
    id: 'CONV-001',
    tenantId: '1',
    agentIds: ['1'],
    status: 'In Progress',
    sentiment: 'moderate negative',
    emotions: ['anger', 'fear'],
    topics: ['Billing', 'Maintenance'],
    summary: 'Alice is concerned about unexpected charges and water leak in bathroom',
    messages: [
      {
        id: '1',
        senderId: '1',
        senderType: 'tenant',
        content: 'Hi, I noticed some strange charges on my bill this month and there\'s also a leak in my bathroom ceiling.',
        timestamp: new Date('2025-08-05T09:00:00'),
        sentiment: -2,
        emotions: ['anger', 'fear'],
        emotionScores: { anger: 0.7, fear: 0.6, sadness: 0.2, neutral: 0.1 }
      },
      {
        id: '2',
        senderId: '1',
        senderType: 'agent',
        content: 'Hi Alice, I\'m sorry to hear about these issues. Let me look into both the billing discrepancy and arrange for maintenance to check the leak.',
        timestamp: new Date('2025-08-05T09:15:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, enjoyment: 0.2 }
      },
      {
        id: '3',
        senderId: '1',
        senderType: 'tenant',
        content: 'Thank you for the quick response. I really appreciate it.',
        timestamp: new Date('2025-08-05T09:30:00'),
        sentiment: 0,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.6, enjoyment: 0.3, anger: 0.1 }
      }
    ],
    lastUpdated: new Date('2025-08-05T09:30:00'),
    startedAt: new Date('2025-08-05T09:00:00')
  },
  {
    id: 'CONV-002', 
    tenantId: '1',
    agentIds: ['1', '3'],
    status: 'Solved',
    sentiment: 'weak positive',
    emotions: ['enjoyment'],
    topics: ['Amenities'],
    summary: 'Alice requested information about gym hours and pool maintenance schedule',
    messages: [
      {
        id: '4',
        senderId: '1', 
        senderType: 'tenant',
        content: 'Could you please send me the current gym hours and let me know when the pool will be cleaned next?',
        timestamp: new Date('2025-08-03T14:30:00'),
        sentiment: 0,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.9, enjoyment: 0.1 }
      },
      {
        id: '5',
        senderId: '3',
        senderType: 'agent', 
        content: 'Hi Alice! The gym is open 5 AM - 11 PM daily, and the pool is cleaned every Tuesday and Friday morning.',
        timestamp: new Date('2025-08-03T14:45:00'),
        sentiment: 2,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.8, neutral: 0.2 }
      },
      {
        id: '6',
        senderId: '1',
        senderType: 'tenant',
        content: 'Perfect, thank you so much! This is very helpful.',
        timestamp: new Date('2025-08-03T14:50:00'),
        sentiment: 2,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.9, surprise: 0.1 }
      }
    ],
    lastUpdated: new Date('2025-08-03T14:50:00'),
    startedAt: new Date('2025-08-03T14:30:00')
  },
  {
    id: 'CONV-003',
    tenantId: '2',
    agentIds: ['2'],
    status: 'In Progress', 
    sentiment: 'strong negative',
    emotions: ['anger', 'disgust'],
    topics: ['Noise', 'Cleaning'],
    summary: 'Brian is frustrated about ongoing noise issues and poor hallway cleaning',
    messages: [
      {
        id: '7',
        senderId: '2',
        senderType: 'tenant',
        content: 'This is the third time I\'m complaining about loud music from upstairs after 11 PM. Also, the hallways haven\'t been properly cleaned in weeks.',
        timestamp: new Date('2025-08-07T22:30:00'),
        sentiment: -3,
        emotions: ['anger', 'disgust'],
        emotionScores: { anger: 0.8, disgust: 0.7, sadness: 0.3, fear: 0.2 }
      },
      {
        id: '8',
        senderId: '2',
        senderType: 'agent',
        content: 'I understand your frustration, Brian. Let me escalate both the noise complaint and cleaning issues to management immediately.',
        timestamp: new Date('2025-08-07T22:45:00'),
        sentiment: 0,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.7, sadness: 0.3 }
      }
    ],
    lastUpdated: new Date('2025-08-07T22:45:00'),
    startedAt: new Date('2025-08-07T22:30:00')
  },
  {
    id: 'CONV-004',
    tenantId: '3',
    agentIds: ['1'],
    status: 'Solved',
    sentiment: 'moderate positive', 
    emotions: ['enjoyment', 'surprise'],
    topics: ['Maintenance'],
    summary: 'Clara reported and got quick resolution for broken elevator',
    messages: [
      {
        id: '9',
        senderId: '3',
        senderType: 'tenant',
        content: 'The elevator in our building stopped working this morning. Just wanted to report it.',
        timestamp: new Date('2025-08-02T08:00:00'),
        sentiment: -1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.7, sadness: 0.2, fear: 0.1 }
      },
      {
        id: '10', 
        senderId: '1',
        senderType: 'agent',
        content: 'Thank you for reporting this Clara. I\'ve contacted our maintenance team and they should have it fixed within 2 hours.',
        timestamp: new Date('2025-08-02T08:15:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, enjoyment: 0.2 }
      },
      {
        id: '11',
        senderId: '3',
        senderType: 'tenant',
        content: 'Wow, that was fast! The elevator is working perfectly now. Thank you so much!',
        timestamp: new Date('2025-08-02T10:30:00'),
        sentiment: 2,
        emotions: ['enjoyment', 'surprise'],
        emotionScores: { enjoyment: 0.9, surprise: 0.8, neutral: 0.1 }
      }
    ],
    lastUpdated: new Date('2025-08-02T10:30:00'),
    startedAt: new Date('2025-08-02T08:00:00')
  },
  {
    id: 'CONV-005',
    tenantId: '4',
    agentIds: ['3', '4'],
    status: 'In Progress',
    sentiment: 'neutral',
    emotions: ['neutral'],
    topics: ['Amenities', 'Maintenance'],
    summary: 'David inquiring about parking space assignment and requesting bike storage access',
    messages: [
      {
        id: '12',
        senderId: '4',
        senderType: 'tenant',
        content: 'Hi, I just moved in last week and I\'m wondering about my parking space assignment. Also, how can I get access to the bike storage room?',
        timestamp: new Date('2025-08-09T10:00:00'),
        sentiment: 0,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.9, enjoyment: 0.1 }
      },
      {
        id: '13',
        senderId: '3',
        senderType: 'agent',
        content: 'Welcome David! Let me check your parking assignment. For bike storage, I\'ll coordinate with maintenance to get you a key.',
        timestamp: new Date('2025-08-09T10:15:00'),
        sentiment: 1,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.7, neutral: 0.3 }
      },
      {
        id: '14',
        senderId: '4',
        senderType: 'agent',
        content: 'Your parking space is #47 in the underground garage. I can meet you there tomorrow at 2 PM with the bike storage key.',
        timestamp: new Date('2025-08-09T11:00:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, enjoyment: 0.2 }
      }
    ],
    lastUpdated: new Date('2025-08-09T11:00:00'),
    startedAt: new Date('2025-08-09T10:00:00')
  },
  {
    id: 'CONV-006',
    tenantId: '5',
    agentIds: ['1'],
    status: 'Solved',
    sentiment: 'strong positive',
    emotions: ['enjoyment'],
    topics: ['Amenities'],
    summary: 'Emma expressing gratitude for the new rooftop garden and asking about gardening guidelines',
    messages: [
      {
        id: '15',
        senderId: '5',
        senderType: 'tenant',
        content: 'The new rooftop garden is absolutely beautiful! I love what you\'ve done with the space. Are there any guidelines for residents who want to help with gardening?',
        timestamp: new Date('2025-08-06T16:20:00'),
        sentiment: 2,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.9, surprise: 0.3, neutral: 0.1 }
      },
      {
        id: '16',
        senderId: '1',
        senderType: 'agent',
        content: 'Thank you Emma! We\'re so glad you\'re enjoying it. Yes, we have a community gardening program. I\'ll send you the sign-up form and schedule.',
        timestamp: new Date('2025-08-06T16:35:00'),
        sentiment: 2,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.8, neutral: 0.2 }
      },
      {
        id: '17',
        senderId: '5',
        senderType: 'tenant',
        content: 'Perfect! I\'m so excited to participate. This really makes our building feel like a community.',
        timestamp: new Date('2025-08-06T16:40:00'),
        sentiment: 3,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.95, surprise: 0.2, neutral: 0.05 }
      }
    ],
    lastUpdated: new Date('2025-08-06T16:40:00'),
    startedAt: new Date('2025-08-06T16:20:00')
  },
  {
    id: 'CONV-007',
    tenantId: '6',
    agentIds: ['2', '5'],
    status: 'In Progress',
    sentiment: 'weak negative',
    emotions: ['fear', 'anger'],
    topics: ['Billing', 'Noise'],
    summary: 'Frank concerned about utility bill increase and construction noise during work hours',
    messages: [
      {
        id: '18',
        senderId: '6',
        senderType: 'tenant',
        content: 'My utility bill has increased by 40% this month with no explanation. Also, the construction noise during my work-from-home hours is becoming unbearable.',
        timestamp: new Date('2025-08-10T09:30:00'),
        sentiment: -2,
        emotions: ['anger', 'fear'],
        emotionScores: { anger: 0.6, fear: 0.5, sadness: 0.3, neutral: 0.2 }
      },
      {
        id: '19',
        senderId: '2',
        senderType: 'agent',
        content: 'I understand your concerns, Frank. Let me investigate the billing issue and check our construction schedule to see if we can adjust the timing.',
        timestamp: new Date('2025-08-10T09:45:00'),
        sentiment: 0,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, sadness: 0.2 }
      },
      {
        id: '20',
        senderId: '5',
        senderType: 'agent',
        content: 'Hi Frank, I found that the utility spike was due to a meter reading error. We\'ll credit your account. Construction will be limited to 10 AM - 4 PM starting next week.',
        timestamp: new Date('2025-08-10T14:20:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.7, enjoyment: 0.3 }
      }
    ],
    lastUpdated: new Date('2025-08-10T14:20:00'),
    startedAt: new Date('2025-08-10T09:30:00')
  },
  {
    id: 'CONV-008',
    tenantId: '2',
    agentIds: ['4'],
    status: 'Solved',
    sentiment: 'moderate positive',
    emotions: ['enjoyment'],
    topics: ['Maintenance'],
    summary: 'Brian satisfied with quick air conditioning repair and professional service',
    messages: [
      {
        id: '21',
        senderId: '2',
        senderType: 'tenant',
        content: 'My AC unit stopped cooling yesterday. The temperature in my apartment is getting uncomfortable.',
        timestamp: new Date('2025-08-04T15:10:00'),
        sentiment: -1,
        emotions: ['sadness'],
        emotionScores: { sadness: 0.6, fear: 0.3, neutral: 0.4 }
      },
      {
        id: '22',
        senderId: '4',
        senderType: 'agent',
        content: 'Hi Brian, I\'ll have our HVAC technician come by this afternoon to take a look. Can you be available around 3 PM?',
        timestamp: new Date('2025-08-04T15:25:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, enjoyment: 0.2 }
      },
      {
        id: '23',
        senderId: '2',
        senderType: 'tenant',
        content: 'The technician was excellent - very professional and fixed the issue quickly. AC is working perfectly now. Thank you!',
        timestamp: new Date('2025-08-04T17:45:00'),
        sentiment: 2,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.8, surprise: 0.3, neutral: 0.2 }
      }
    ],
    lastUpdated: new Date('2025-08-04T17:45:00'),
    startedAt: new Date('2025-08-04T15:10:00')
  },
  {
    id: 'CONV-009',
    tenantId: '4',
    agentIds: ['3'],
    status: 'In Progress',
    sentiment: 'weak positive',
    emotions: ['enjoyment', 'surprise'],
    topics: ['Amenities'],
    summary: 'David pleased with new fitness equipment and asking about personal training sessions',
    messages: [
      {
        id: '24',
        senderId: '4',
        senderType: 'tenant',
        content: 'I noticed you\'ve added some new equipment to the gym. The rowing machine is fantastic! Do you offer any personal training sessions?',
        timestamp: new Date('2025-08-11T07:30:00'),
        sentiment: 1,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.8, surprise: 0.4, neutral: 0.2 }
      },
      {
        id: '25',
        senderId: '3',
        senderType: 'agent',
        content: 'So glad you\'re enjoying the new equipment! We\'re actually launching a personal training program next month. I can put you on the interest list.',
        timestamp: new Date('2025-08-11T08:15:00'),
        sentiment: 2,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.9, neutral: 0.1 }
      }
    ],
    lastUpdated: new Date('2025-08-11T08:15:00'),
    startedAt: new Date('2025-08-11T07:30:00')
  },
  {
    id: 'CONV-010',
    tenantId: '3',
    agentIds: ['5', '1'],
    status: 'Solved',
    sentiment: 'neutral',
    emotions: ['neutral'],
    topics: ['Cleaning'],
    summary: 'Clara reporting carpet stains in hallway and requesting professional cleaning',
    messages: [
      {
        id: '26',
        senderId: '3',
        senderType: 'tenant',
        content: 'There are some significant carpet stains on the 7th floor hallway that seem to be getting worse. Could we schedule a professional cleaning?',
        timestamp: new Date('2025-08-01T11:00:00'),
        sentiment: 0,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, disgust: 0.2 }
      },
      {
        id: '27',
        senderId: '5',
        senderType: 'agent',
        content: 'Thank you for reporting this, Clara. I\'ll arrange for our professional cleaning service to address the hallway carpets this week.',
        timestamp: new Date('2025-08-01T11:30:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.9, enjoyment: 0.1 }
      },
      {
        id: '28',
        senderId: '1',
        senderType: 'agent',
        content: 'Hi Clara, the cleaning has been completed. The carpets look much better now. Thank you for bringing this to our attention.',
        timestamp: new Date('2025-08-01T16:00:00'),
        sentiment: 1,
        emotions: ['neutral'],
        emotionScores: { neutral: 0.8, enjoyment: 0.2 }
      },
      {
        id: '29',
        senderId: '3',
        senderType: 'tenant',
        content: 'Perfect, thank you for the quick response. The hallway looks great now.',
        timestamp: new Date('2025-08-01T18:30:00'),
        sentiment: 1,
        emotions: ['enjoyment'],
        emotionScores: { enjoyment: 0.6, neutral: 0.4 }
      }
    ],
    lastUpdated: new Date('2025-08-01T18:30:00'),
    startedAt: new Date('2025-08-01T11:00:00')
  }
];

export function getSentimentScore(sentiment: string): number {
  const index = sentimentLevels.indexOf(sentiment);
  return index - 3; // Convert to -3 to +3 scale
}

export function getSentimentColor(sentiment: string): string {
  const score = getSentimentScore(sentiment);
  if (score <= -2) return 'bg-red-500';
  if (score === -1) return 'bg-orange-500'; 
  if (score === 0) return 'bg-gray-500';
  if (score === 1) return 'bg-yellow-500';
  if (score >= 2) return 'bg-green-500';
  return 'bg-gray-500';
}

export function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case 'anger': return '#ef4444';
    case 'fear': return '#f97316';
    case 'disgust': return '#84cc16';
    case 'sadness': return '#3b82f6';
    case 'surprise': return '#8b5cf6';
    case 'enjoyment': return '#10b981';
    case 'neutral': return '#6b7280';
    default: return '#6b7280';
  }
}

export function getSentimentAbbreviation(sentimentScore: number): string {
  if (sentimentScore <= -3) return 'SN'; // Strong Negative
  if (sentimentScore === -2) return 'MN'; // Moderate Negative
  if (sentimentScore === -1) return 'WN'; // Weak Negative
  if (sentimentScore === 0) return 'N';   // Neutral
  if (sentimentScore === 1) return 'WP';  // Weak Positive
  if (sentimentScore === 2) return 'MP';  // Moderate Positive
  if (sentimentScore >= 3) return 'SP';   // Strong Positive
  return 'N'; // Default to Neutral
}

export function getTicketTrend(ticket: Ticket): string {
  const messages = ticket.messages.filter(m => m.senderType === 'tenant');
  if (messages.length === 0) return 'N - N';
  
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  
  const firstSentiment = getSentimentAbbreviation(firstMessage.sentiment);
  const lastSentiment = getSentimentAbbreviation(lastMessage.sentiment);
  
  return `${firstSentiment} - ${lastSentiment}`;
}

export function getTrendColor(ticket: Ticket): string {
  const messages = ticket.messages.filter(m => m.senderType === 'tenant');
  if (messages.length === 0) return 'bg-gray-50 text-gray-700 border-gray-300';
  
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  
  const firstSentiment = firstMessage.sentiment;
  const lastSentiment = lastMessage.sentiment;
  
  // Determine trend direction
  if (lastSentiment > firstSentiment) {
    // Improving sentiment
    return 'bg-green-50 text-green-700 border-green-300';
  } else if (lastSentiment < firstSentiment) {
    // Declining sentiment
    return 'bg-red-50 text-red-700 border-red-300';
  } else {
    // No change
    return 'bg-gray-50 text-gray-700 border-gray-300';
  }
}