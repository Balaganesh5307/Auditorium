export interface TeamMember {
  name: string;
  role: string;
}

export interface TeamData {
  table: string;
  teamName: string;
  position: string;
  members: TeamMember[];
  projectDescription: string;
}

export type TeamsMap = Record<string, TeamData>;

const teamNames = [
  'ESPADA', 'NOVA FORGE', 'CIPHER SQUAD', 'DARK MATTER', 'PHOENIX RISE',
  'QUANTUM LEAP', 'IRON FLUX', 'SHADOW NET', 'NEON STRIKE', 'APEX CODE',
  'ZERO GRAVITY', 'BYTE STORM', 'TITAN CORE', 'VORTEX LABS', 'EMBER TECH',
  'RAPID FIRE', 'COBALT WAVE', 'STEEL PULSE', 'PRISM SHIFT', 'ECHO GRID',
  'ORBIT SYNC', 'NEXUS PRIME', 'SPARK CELL', 'FUSION HUB', 'DELTA FORCE',
  'CORE BLITZ', 'SURGE LINK', 'PIXEL CRAFT', 'SIGNAL FIVE', 'TURBO NODE',
  'FLASH POINT', 'OMEGA SQUAD', 'HYPER LOGIC', 'CARBON EDGE', 'MATRIX RUN',
  'THUNDER ARC', 'BLAZE PATH', 'DRIFT SYNC', 'ION FIELD', 'NOVA GRID',
  'PULSE WAVE', 'CHROME UNIT', 'VERTEX AI', 'CRUX LABS', 'WARP DRIVE',
  'ATLAS TEAM', 'HELIX CODE', 'BOLT SYNC', 'INFERNO DEV', 'KINETIC HQ',
  'LUNAR BYTE', 'MAGNET CORE', 'NIMBUS TECH', 'ONYX SHIFT', 'PLASMA NET',
  'QUASAR LABS', 'RADIANT HUB', 'SOLAR LINK', 'TERRA CODE', 'ULTRA SYNC',
];

const roles = ['Team Leader', 'Full-Stack Developer', 'UI/UX Designer', 'Backend Engineer'];

const projectDescriptions = [
  'AI-powered accessibility tool for visually impaired users',
  'Blockchain-based credential verification platform',
  'Real-time collaborative code editor with AI suggestions',
  'Smart city traffic optimization using IoT sensors',
  'Mental health support chatbot using NLP',
  'Decentralized marketplace for digital art',
  'Automated waste sorting system with computer vision',
  'Peer-to-peer renewable energy trading platform',
  'AR-based navigation for indoor spaces',
  'Predictive healthcare analytics dashboard',
  'Voice-controlled home automation framework',
  'Gamified learning platform for STEM education',
  'Supply chain transparency using distributed ledger',
  'AI resume builder with job matching',
  'Sustainable farming advisor with satellite data',
  'Emergency response coordination system',
  'Cross-platform fitness tracker with social features',
  'Smart contract audit automation tool',
  'Language learning via immersive VR scenarios',
  'Community-driven disaster relief platform',
];

const firstNames = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya',
  'Siddharth', 'Neha', 'Aditya', 'Ishita', 'Dev', 'Riya', 'Karthik', 'Shreya',
  'Nikhil', 'Pooja', 'Rahul', 'Divya', 'Manish', 'Tanvi', 'Suresh', 'Anjali',
  'Akash', 'Sneha', 'Varun', 'Nisha', 'Gaurav', 'Simran', 'Harsh', 'Kriti',
  'Mohit', 'Swati', 'Pranav', 'Sakshi', 'Tushar', 'Deepika', 'Vivek', 'Pallavi',
  'Abhishek', 'Madhuri', 'Rajat', 'Trisha', 'Kunal', 'Bhavna', 'Yash', 'Ritika',
  'Amit', 'Komal', 'Saurabh', 'Megha', 'Piyush', 'Aditi', 'Rohit', 'Jaya',
  'Sameer', 'Lata', 'Tarun', 'Chitra',
];

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Joshi',
  'Mehta', 'Iyer', 'Das', 'Rao', 'Verma', 'Chopra', 'Bhat', 'Desai',
  'Pillai', 'Mishra', 'Chauhan', 'Malhotra',
];

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const cols = [1, 2, 3, 4, 5, 6];

function generateTeams(): TeamsMap {
  const teams: TeamsMap = {};
  let index = 0;

  for (const row of rows) {
    for (const col of cols) {
      const tableId = `${row}${col}`;
      const nameOffset = index * 4;

      teams[tableId] = {
        table: tableId,
        teamName: teamNames[index % teamNames.length],
        position: tableId,
        members: roles.map((role, i) => ({
          name: `${firstNames[(nameOffset + i) % firstNames.length]} ${lastNames[(nameOffset + i) % lastNames.length]}`,
          role,
        })),
        projectDescription: projectDescriptions[index % projectDescriptions.length],
      };

      index++;
    }
  }

  return teams;
}

export const teams: TeamsMap = generateTeams();

export const tableRows = rows;
export const tableCols = cols;
