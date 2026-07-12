'use client';

import { useState } from 'react';
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
  title: string;
  subtitle: string;
  description: string;
  steps: Step[];
}

export default function RoadmapsPage() {
  const roadmaps: Roadmap[] = [
    {
      id: 'cybersecurity',
      title: 'Cybersecurity Analyst',
      subtitle: 'From zero fundamentals to practical blue/red teaming operations.',
      description: 'Follow this sequential roadmap to build a credible cybersecurity foundation, earning industry-recognized credentials at each tier.',
      steps: [
        {
          title: '1. Networking Fundamentals',
          description: 'Master routers, switches, subnets, OSI model layers, and core TCP/IP protocols.',
          skills: ['TCP/IP', 'DNS/DHCP', 'Subnetting', 'Routing'],
          recommendation: 'Google IT Support Professional Certificate OR Cisco Certified Network Associate (CCNA)',
        },
        {
          title: '2. Linux Command Line & Admin',
          description: 'Understand command shell navigation, folder permissions, cron jobs, and basic bash scripting.',
          skills: ['Bash Scripting', 'File permissions', 'System administration'],
          recommendation: 'NDG Linux Essentials (Cisco Networking Academy)',
        },
        {
          title: '3. Python Scripting for Security',
          description: 'Write simple scripts to automate log parses, request payloads, and network scans.',
          skills: ['Python Scripting', 'Automation', 'Scripting'],
          recommendation: 'Python for Everybody Specialization (Coursera)',
        },
        {
          title: '4. Security Operations & Blue Teaming',
          description: 'Learn malware analysis, network packet captures, firewalls, and SIEM monitoring.',
          skills: ['Wireshark', 'SIEM', 'Firewalls', 'SOC Operations'],
          recommendation: 'Google Cybersecurity Professional Certificate (CompTIA Security+ aligned)',
        },
        {
          title: '5. Practical Penetration Testing Labs',
          description: 'Run network penetration tests, exploit web vulnerabilities, and report patches.',
          skills: ['Pentesting', 'Metasploit', 'Nmap', 'Burp Suite'],
          recommendation: 'eLearnSecurity Junior Penetration Tester (eJPT)',
        },
      ],
    },
    {
      id: 'data-analyst',
      title: 'Data Analyst in 30 Days',
      subtitle: 'A structural plan covering SQL databases, statistics, and dashboard graphics.',
      description: 'Become a highly requested data professional by mastering relational databases, python scripts, and business intelligence suites.',
      steps: [
        {
          title: 'Phase 1: Microsoft Excel Advanced',
          description: 'Work with Pivot Tables, VLOOKUPs, XLOOKUPs, power queries, and formulas.',
          skills: ['Pivot Tables', 'Data Cleaning', 'Power Query'],
          recommendation: 'Microsoft Office Specialist: Excel Associate',
        },
        {
          title: 'Phase 2: SQL Relational Databases',
          description: 'Write queries containing JOINs, aggregate functions, Subqueries, CTEs, and Window Functions.',
          skills: ['PostgreSQL', 'Database Queries', 'Aggregation'],
          recommendation: 'Google Data Analytics Professional Certificate (SQL Modules)',
        },
        {
          title: 'Phase 3: Business Intelligence (Power BI/Tableau)',
          description: 'Connect databases to BI suites to render dynamic sales, product, or engagement dashboards.',
          skills: ['Data Visualization', 'DAX', 'Dashboard Design'],
          recommendation: 'Microsoft Certified: Power BI Data Analyst Associate (PL-300)',
        },
        {
          title: 'Phase 4: Python Data Ecosystem',
          description: 'Leverage Pandas libraries for data cleanup and Matplotlib/Seaborn for advanced data plotting.',
          skills: ['Pandas', 'Jupyter Notebooks', 'Data Science'],
          recommendation: 'IBM Data Analyst Professional Certificate (Python Modules)',
        },
        {
          title: 'Phase 5: Statistics & Portfolio Projects',
          description: 'Apply regression analysis, probability matrices, and compile projects into a GitHub portfolio.',
          skills: ['Probability', 'Regression', 'Portfolio Design'],
          recommendation: 'Verify and Showcase your custom projects using CertXchange Passports!',
        },
      ],
    },
  ];

  const [activeTab, setActiveTab] = useState(roadmaps[0].id);
  const activeRoadmap = roadmaps.find((r) => r.id === activeTab) || roadmaps[0];

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full z-10">
        
        {/* Header */}
        <div className="border-b border-border/40 pb-6 mb-8">
          <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ CertXchange curriculum</div>
          <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">
            LEARNING ROADMAPS
          </h1>
          <p className="text-xs text-mutedHigh">
            Step-by-step career blueprints with verified certificate recommendation milestones.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-2 mb-8">
          {roadmaps.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveTab(r.id)}
              className={`px-5 py-3 rounded font-mono text-xs uppercase tracking-wider transition ${
                activeTab === r.id
                  ? 'bg-accent text-black font-bold'
                  : 'bg-surface border border-border text-muted hover:text-text'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>

        {/* Roadmap Display */}
        <div className="border border-border bg-surface p-6 md:p-8 rounded-lg space-y-6">
          <div>
            <h2 className="font-display text-2xl text-text uppercase tracking-wider mb-2">
              {activeRoadmap.title}
            </h2>
            <p className="text-xs text-mutedHigh font-mono mb-4">{activeRoadmap.subtitle}</p>
            <p className="text-xs text-mutedHigh leading-relaxed border-l-2 border-accent pl-4 font-mono">
              {activeRoadmap.description}
            </p>
          </div>

          {/* Timeline steps */}
          <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 pt-6">
            {activeRoadmap.steps.map((step, idx) => (
              <div key={idx} className="relative pl-10 group">
                
                {/* Timeline node */}
                <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-bg border-2 border-accent group-hover:bg-accent transition duration-150" />
                
                <div className="border border-border bg-surfaceHigh/40 p-5 rounded-lg hover:border-accent transition duration-150">
                  <h3 className="font-mono text-xs font-bold text-text uppercase tracking-wider mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-mutedHigh leading-relaxed font-mono mb-4">
                    {step.description}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {step.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[9px] bg-border/20 px-2 py-0.5 text-text rounded font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Recommended Cert */}
                  <div className="p-3 bg-bg/50 border border-accent/20 rounded font-mono text-[10px] text-accent">
                    <span className="font-bold uppercase tracking-wider block mb-1">Recommended Achievement:</span>
                    <span>{step.recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
