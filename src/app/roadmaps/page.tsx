'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/layout/NavBar';

interface Step {
  title: string;
  description: string;
  skills: string[];
  recommendation: string;
  certUrl?: string;
}

interface Roadmap {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  steps: Step[];
}

const ROADMAPS: Roadmap[] = [
  {
    id: 'cybersecurity',
    emoji: '🛡️',
    title: 'Cybersecurity Analyst',
    subtitle: 'From zero fundamentals to practical blue/red teaming operations.',
    description: 'Follow this sequential roadmap to build a credible cybersecurity foundation, earning industry-recognized credentials at each tier.',
    steps: [
      {
        title: '1. Networking Fundamentals',
        description: 'Master routers, switches, subnets, OSI model layers, and core TCP/IP protocols. These are the foundations of every security role.',
        skills: ['TCP/IP', 'DNS/DHCP', 'Subnetting', 'Routing', 'OSI Model'],
        recommendation: 'Google IT Support Professional Certificate OR Cisco CCNA',
      },
      {
        title: '2. Linux Command Line & Admin',
        description: 'Navigate the shell, manage file permissions, schedule cron jobs, and write basic bash automation scripts.',
        skills: ['Bash Scripting', 'File permissions', 'System administration', 'SSH'],
        recommendation: 'NDG Linux Essentials (Cisco Networking Academy)',
      },
      {
        title: '3. Python Scripting for Security',
        description: 'Write scripts to automate log parsing, generate network payloads, and perform file system audits.',
        skills: ['Python', 'Automation', 'Scripting', 'Log analysis'],
        recommendation: 'Python for Everybody Specialization (Coursera)',
      },
      {
        title: '4. Security Operations & Blue Teaming',
        description: 'Analyze malware, capture network packets with Wireshark, configure firewalls, and monitor SIEM dashboards.',
        skills: ['Wireshark', 'SIEM', 'Firewalls', 'SOC Operations', 'Log monitoring'],
        recommendation: 'Google Cybersecurity Professional Certificate (CompTIA Security+ aligned)',
      },
      {
        title: '5. Practical Penetration Testing',
        description: 'Run network pentest labs, exploit web vulnerabilities via OWASP Top 10, and report findings professionally.',
        skills: ['Pentesting', 'Metasploit', 'Nmap', 'Burp Suite', 'OWASP'],
        recommendation: 'eLearnSecurity Junior Penetration Tester (eJPT)',
      },
    ],
  },
  {
    id: 'data-analyst',
    emoji: '📊',
    title: 'Data Analyst',
    subtitle: 'SQL databases, statistics, dashboard graphics, and Python data science.',
    description: 'Become a sought-after data professional by mastering relational databases, Python scripting, and business intelligence tools.',
    steps: [
      {
        title: 'Phase 1: Microsoft Excel Advanced',
        description: 'Work with Pivot Tables, VLOOKUPs, XLOOKUPs, Power Query, and data cleaning techniques.',
        skills: ['Pivot Tables', 'VLOOKUP/XLOOKUP', 'Data Cleaning', 'Power Query'],
        recommendation: 'Microsoft Office Specialist: Excel Associate',
      },
      {
        title: 'Phase 2: SQL Relational Databases',
        description: 'Write queries with JOINs, aggregate functions, subqueries, CTEs, and Window Functions.',
        skills: ['PostgreSQL', 'JOINs', 'CTEs', 'Window Functions', 'Aggregation'],
        recommendation: 'Google Data Analytics Professional Certificate (SQL Modules)',
      },
      {
        title: 'Phase 3: Business Intelligence (Power BI)',
        description: 'Connect databases to BI dashboards and render dynamic sales, product, and engagement reports.',
        skills: ['Power BI', 'DAX', 'Tableau', 'Dashboard Design', 'KPIs'],
        recommendation: 'Microsoft Certified: Power BI Data Analyst Associate (PL-300)',
      },
      {
        title: 'Phase 4: Python Data Ecosystem',
        description: 'Use Pandas for data cleanup, Matplotlib/Seaborn for plotting, and Jupyter for notebooks.',
        skills: ['Pandas', 'NumPy', 'Matplotlib', 'Jupyter Notebooks', 'Data Science'],
        recommendation: 'IBM Data Analyst Professional Certificate (Python Modules)',
      },
      {
        title: 'Phase 5: Statistics & Portfolio Projects',
        description: 'Apply regression analysis, probability distributions, and compile 3 GitHub projects for your portfolio.',
        skills: ['Probability', 'Regression Analysis', 'A/B Testing', 'Portfolio Design'],
        recommendation: 'Showcase your projects with a CertXchange Passport for recruiter verification!',
      },
    ],
  },
  {
    id: 'aws-cloud',
    emoji: '☁️',
    title: 'AWS Cloud Practitioner',
    subtitle: 'From zero cloud knowledge to AWS Certified Cloud Practitioner in 30 days.',
    description: 'Learn cloud fundamentals, AWS core services, pricing models, and security foundations to pass the AWS CCP exam.',
    steps: [
      {
        title: 'Phase 1: Cloud Computing Fundamentals',
        description: 'Understand IaaS, PaaS, SaaS models, shared responsibility, and why businesses migrate to the cloud.',
        skills: ['IaaS/PaaS/SaaS', 'Cloud economics', 'Shared responsibility', 'Regions/AZs'],
        recommendation: 'AWS Cloud Quest: Cloud Practitioner (Free on AWS Skill Builder)',
      },
      {
        title: 'Phase 2: Core AWS Services',
        description: 'Master EC2 instances, S3 storage buckets, RDS databases, Lambda functions, and VPC networking.',
        skills: ['EC2', 'S3', 'RDS', 'Lambda', 'VPC', 'IAM'],
        recommendation: 'AWS Educate: Getting Started with Cloud Ops',
      },
      {
        title: 'Phase 3: Security & Compliance',
        description: 'Configure IAM policies, MFA, CloudTrail audit logs, and understand AWS compliance programs.',
        skills: ['IAM Policies', 'MFA', 'CloudTrail', 'KMS', 'Compliance'],
        recommendation: 'AWS Certified Security – Specialty (starter modules)',
      },
      {
        title: 'Phase 4: Pricing & Support Models',
        description: 'Calculate total cost of ownership, understand Reserved/Spot/On-Demand pricing, and AWS Support tiers.',
        skills: ['TCO Calculator', 'Pricing models', 'Cost Explorer', 'Billing Alerts'],
        recommendation: 'AWS Pricing Calculator practice labs',
      },
      {
        title: 'Phase 5: Exam Prep & Certification',
        description: 'Take 3 full practice exams, review all failed domains, and schedule the AWS CCP exam.',
        skills: ['Exam strategy', 'Practice tests', 'AWS CCP domains'],
        recommendation: 'AWS Certified Cloud Practitioner (CLF-C02) — Earn & add to CertXchange Passport!',
      },
    ],
  },
  {
    id: 'fullstack-web',
    emoji: '🌐',
    title: 'Full Stack Web Dev',
    subtitle: 'Build production-ready web apps from HTML to React to Node.js backend.',
    description: 'A progressive roadmap covering frontend fundamentals, React ecosystem, backend APIs, database design, and deployment.',
    steps: [
      {
        title: 'Phase 1: HTML, CSS & JavaScript Core',
        description: 'Build semantic layouts, responsive CSS Flexbox/Grid, and vanilla JavaScript DOM manipulation.',
        skills: ['Semantic HTML5', 'CSS Grid/Flexbox', 'JavaScript ES6+', 'DOM Manipulation'],
        recommendation: 'The Odin Project: Foundations (100% Free)',
      },
      {
        title: 'Phase 2: React & Modern Frontend',
        description: 'Build component-driven SPAs with React hooks, state management, routing, and API integration.',
        skills: ['React', 'Hooks', 'React Router', 'Zustand/Redux', 'TypeScript basics'],
        recommendation: 'Meta Front-End Developer Professional Certificate (Coursera)',
      },
      {
        title: 'Phase 3: Backend & Node.js APIs',
        description: 'Build RESTful APIs with Node.js + Express, handle authentication with JWT/sessions, and write middleware.',
        skills: ['Node.js', 'Express', 'REST APIs', 'JWT Authentication', 'Middleware'],
        recommendation: 'Meta Back-End Developer Professional Certificate (Coursera)',
      },
      {
        title: 'Phase 4: Databases & SQL',
        description: 'Design PostgreSQL schemas, write complex queries, and use ORMs like Prisma for type-safe DB access.',
        skills: ['PostgreSQL', 'Database Design', 'Prisma ORM', 'SQL Queries'],
        recommendation: 'Google Data Analytics — SQL for Developers track',
      },
      {
        title: 'Phase 5: Deployment & DevOps Basics',
        description: 'Deploy apps on Vercel/Railway, set up CI/CD GitHub Actions, configure environment variables, and monitor errors.',
        skills: ['Vercel', 'Docker basics', 'GitHub Actions', 'CI/CD', 'Environment config'],
        recommendation: 'Build & deploy a full portfolio project — list it on CertXchange Showcase!',
      },
    ],
  },
];

export default function RoadmapsPage() {
  const [activeTab, setActiveTab] = useState(ROADMAPS[0].id);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const activeRoadmap = ROADMAPS.find((r) => r.id === activeTab) || ROADMAPS[0];

  // Load completion state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cx_roadmap_progress');
      if (stored) setCompletedSteps(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const toggleStep = (key: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('cx_roadmap_progress', JSON.stringify(next));
      return next;
    });
  };

  const stepsCompleted = activeRoadmap.steps.filter((_, i) =>
    completedSteps[`${activeRoadmap.id}-${i}`]
  ).length;

  const progressPct = Math.round((stepsCompleted / activeRoadmap.steps.length) * 100);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full z-10">

        {/* Header */}
        <div className="border-b border-border/40 pb-6 mb-8">
          <div className="text-[#1565FE] text-[10px] tracking-widest uppercase mb-2 font-mono">✦ CertXchange curriculum</div>
          <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">Learning Roadmaps</h1>
          <p className="text-xs text-mutedHigh font-mono">
            Step-by-step career blueprints with verified certificate milestones. Track your progress.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2 mb-8">
          {ROADMAPS.map((r) => {
            const done = r.steps.filter((_, i) => completedSteps[`${r.id}-${i}`]).length;
            const total = r.steps.length;
            return (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition ${
                  activeTab === r.id
                    ? 'bg-[#1565FE] text-white font-bold shadow-md shadow-[#1565FE]/20'
                    : 'bg-surface border border-border text-muted hover:text-text hover:border-[#1565FE]/50'
                }`}
              >
                <span>{r.emoji}</span>
                <span>{r.title}</span>
                {done > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    activeTab === r.id ? 'bg-white/20 text-white' : 'bg-[#1565FE]/10 text-[#1565FE]'
                  }`}>
                    {done}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress bar for active roadmap */}
        <div className="mb-8 p-4 border border-border bg-surface rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <div className="font-mono text-xs text-text font-bold">
              {activeRoadmap.emoji} {activeRoadmap.title} Progress
            </div>
            <div className="font-mono text-xs text-[#1565FE] font-bold">
              {stepsCompleted} / {activeRoadmap.steps.length} steps — {progressPct}%
            </div>
          </div>
          <div className="w-full bg-border/20 h-3 rounded-full overflow-hidden">
            <div
              className="bg-[#1565FE] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {progressPct === 100 && (
            <div className="mt-2 text-center text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
              🏆 Roadmap Complete! Claim your certificate from the Exchange.
            </div>
          )}
        </div>

        {/* Roadmap card */}
        <div className="border border-border bg-surface p-6 md:p-8 rounded-xl space-y-6">
          <div>
            <h2 className="font-display text-2xl text-text uppercase tracking-wider mb-1">{activeRoadmap.title}</h2>
            <p className="text-xs text-mutedHigh font-mono mb-3">{activeRoadmap.subtitle}</p>
            <p className="text-xs text-mutedHigh leading-relaxed border-l-2 border-[#1565FE] pl-4 font-mono">
              {activeRoadmap.description}
            </p>
          </div>

          {/* Timeline steps */}
          <div className="space-y-5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 pt-4">
            {activeRoadmap.steps.map((step, idx) => {
              const key = `${activeRoadmap.id}-${idx}`;
              const done = completedSteps[key];
              return (
                <div key={idx} className="relative pl-10 group">
                  {/* Timeline node */}
                  <div className={`absolute left-2.5 top-3 w-3.5 h-3.5 rounded-full border-2 transition duration-200 ${
                    done ? 'bg-[#1565FE] border-[#1565FE]' : 'bg-bg border-border group-hover:border-[#1565FE]'
                  }`}>
                    {done && <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">✓</span>}
                  </div>

                  <div className={`border p-5 rounded-xl transition duration-200 ${
                    done
                      ? 'border-[#1565FE]/30 bg-[#1565FE]/5'
                      : 'border-border bg-surfaceHigh/40 hover:border-[#1565FE]/50'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className={`font-mono text-xs font-bold uppercase tracking-wider ${done ? 'text-[#1565FE]' : 'text-text'}`}>
                        {step.title}
                      </h3>
                      <button
                        onClick={() => toggleStep(key)}
                        className={`shrink-0 px-3 py-1 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider transition ${
                          done
                            ? 'bg-[#1565FE]/20 border border-[#1565FE]/40 text-[#1565FE]'
                            : 'bg-bg border border-border hover:border-[#1565FE] text-muted hover:text-text'
                        }`}
                      >
                        {done ? '✓ Done' : 'Mark Done'}
                      </button>
                    </div>

                    <p className="text-xs text-mutedHigh leading-relaxed font-mono mb-4">{step.description}</p>

                    {/* Skill tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {step.skills.map((skill) => (
                        <span key={skill}
                          className="text-[9px] bg-border/20 border border-border/40 px-2 py-0.5 text-text rounded font-mono">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 bg-bg/50 border border-[#1565FE]/20 rounded-lg font-mono text-[10px] text-[#1565FE]">
                      <span className="font-bold uppercase tracking-wider block mb-1">🏅 Recommended Achievement:</span>
                      <span className="text-mutedHigh">{step.recommendation}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
