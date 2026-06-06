import type { ResumeData } from '../types';
import { cryptoRandomId } from './aiGenerator';

export function emptyResume(): ResumeData {
  return {
    id: cryptoRandomId(),
    title: 'Untitled Resume',
    contact: { fullName: '', email: '', phone: '', linkedin: '', location: '', github: '', portfolio: '' },
    summary: '',
    experience: [],
    education: [],
    skills: { technical: [], soft: [], tools: [], languages: [] },
    projects: [],
    certifications: [],
    jobDescription: '',
    targetJobTitle: '',
    country: 'USA',
    templateId: 'classic-pro',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const SAMPLE_JOB_DESCRIPTION = `Senior Frontend Engineer

We are seeking a Senior Frontend Engineer with 5+ years of experience to join our growing platform team. The ideal candidate will be an expert in React, TypeScript, and Next.js, with a passion for building beautiful, performant web applications.

Responsibilities:
- Design and build scalable user interfaces using React and TypeScript
- Collaborate with product, design, and backend teams in an Agile environment
- Optimize web applications for maximum speed and accessibility
- Mentor junior engineers and lead code reviews
- Drive adoption of best practices including TDD, CI/CD, and design systems
- Work with REST and GraphQL APIs

Requirements:
- 5+ years of professional JavaScript/TypeScript experience
- Expert knowledge of React, Next.js, and modern frontend tooling
- Strong CSS skills, including Tailwind CSS
- Experience with Node.js and REST APIs
- Familiarity with AWS, Docker, and CI/CD pipelines
- Excellent communication, leadership, and stakeholder management skills
- Bachelor's degree in Computer Science or equivalent experience

Nice to have:
- GraphQL, Redux, Jest, Cypress
- Experience with design systems and accessibility (a11y)
- Open-source contributions`;

export function sampleResume(): ResumeData {
  return {
    id: cryptoRandomId(),
    title: 'Senior Frontend Engineer Resume',
    contact: {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@gmail.com',
      phone: '+1 415 555 0142',
      linkedin: 'linkedin.com/in/alexmorgan',
      location: 'San Francisco, CA, USA',
      github: 'github.com/alexmorgan',
      portfolio: 'alexmorgan.dev',
    },
    summary: 'Results-driven Senior Frontend Engineer with 6+ years of experience building scalable React and TypeScript applications. Proven track record of leading design systems, mentoring engineers and shipping high-impact products.',
    experience: [
      {
        id: cryptoRandomId(),
        title: 'Senior Frontend Engineer',
        company: 'Northwind Tech',
        location: 'San Francisco, CA',
        startDate: '2022-03',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led migration of legacy app to React and TypeScript, reducing bundle size by 42%',
          'Built design system used across 6 products serving 10K+ users',
          'Mentored 4 junior engineers and led weekly code reviews',
        ],
      },
      {
        id: cryptoRandomId(),
        title: 'Frontend Engineer',
        company: 'Lumio Analytics',
        location: 'Remote',
        startDate: '2019-06',
        endDate: '2022-02',
        current: false,
        bullets: [
          'Developed dashboards with React and D3, improving NPS by 18 points',
          'Improved page load by refactoring code splitting, cutting TTI by 35%',
        ],
      },
    ],
    education: [
      {
        id: cryptoRandomId(),
        degree: 'B.S. Computer Science',
        school: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        startDate: '2014-09',
        endDate: '2018-05',
        gpa: '3.8',
      },
    ],
    skills: {
      technical: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'GraphQL'],
      soft: ['Leadership', 'Communication', 'Mentoring'],
      tools: ['Git', 'VS Code', 'Figma', 'Jira'],
      languages: ['English (Native)', 'Spanish (Conversational)'],
    },
    projects: [
      {
        id: cryptoRandomId(),
        name: 'OpenChart',
        description: 'Open-source charting library used by 200+ projects',
        tech: 'TypeScript, React, D3',
        link: 'github.com/alexmorgan/openchart',
      },
    ],
    certifications: [
      { id: cryptoRandomId(), name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon', date: '2023-06' },
    ],
    jobDescription: SAMPLE_JOB_DESCRIPTION,
    targetJobTitle: 'Senior Frontend Engineer',
    country: 'USA',
    templateId: 'classic-pro',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Re-export the 500+ template engine
export type { Template as TemplateMeta } from './templateEngine';
export {
  TEMPLATES,
  getTemplate,
  TEMPLATE_CATEGORIES,
  TEMPLATE_COUNTRIES,
  TEMPLATE_LAYOUTS,
  COLOR_THEMES,
} from './templateEngine';
