import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, ShieldCheck, AlertCircle, ArrowRight, ArrowLeftRight, Users, CheckCircle2, LayoutGrid, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

interface CohortInfo {
  year: number;
  section: string;
  advisorEmail: string;
  advisorName: string;
  studentEmail: string;
  studentUsername: string;
  studentName: string;
  projectCode: string;
  projectTitle: string;
}

const COHORTS: CohortInfo[] = [
  // Second Year (5 Sections: A - E)
  {
    year: 2,
    section: 'A',
    advisorEmail: 'advisor.2a@college.edu',
    advisorName: 'Prof. Rajesh Verma',
    studentEmail: 'student.2a@college.edu',
    studentUsername: 'student_lead_1',
    studentName: 'Student Lead 1',
    projectCode: 'PRJ-2026-001',
    projectTitle: 'AI-Based Student Performance Prediction',
  },
  {
    year: 2,
    section: 'B',
    advisorEmail: 'advisor.2b@college.edu',
    advisorName: 'Prof. Sunita Rao',
    studentEmail: 'student.2b@college.edu',
    studentUsername: 'student_lead_3',
    studentName: 'Student Lead 3',
    projectCode: 'PRJ-2026-003',
    projectTitle: 'Campus Placement Preparation Portal',
  },
  {
    year: 2,
    section: 'C',
    advisorEmail: 'advisor.2c@college.edu',
    advisorName: 'Prof. Amit Sharma',
    studentEmail: 'student.2c@college.edu',
    studentUsername: 'student_lead_5',
    studentName: 'Student Lead 5',
    projectCode: 'PRJ-2026-005',
    projectTitle: 'College Event Management Platform',
  },
  {
    year: 2,
    section: 'D',
    advisorEmail: 'advisor.3b@college.edu',
    advisorName: 'Prof. Manoj Tiwari',
    studentEmail: 'student.2d@college.edu',
    studentUsername: 'student_lead_7',
    studentName: 'Student Lead 7',
    projectCode: 'PRJ-2026-007',
    projectTitle: 'Secure Online Examination System',
  },
  {
    year: 2,
    section: 'E',
    advisorEmail: 'advisor.2e@college.edu',
    advisorName: 'Prof. Karthik Iyer',
    studentEmail: 'student.2e@college.edu',
    studentUsername: 'student_lead_9',
    studentName: 'Student Lead 9',
    projectCode: 'PRJ-2026-009',
    projectTitle: 'Smart Waste Classification System',
  },

  // Third Year (4 Sections: A - D)
  {
    year: 3,
    section: 'A',
    advisorEmail: 'advisor.3a@college.edu',
    advisorName: 'Prof. Sneha Kulkarni',
    studentEmail: 'student.3a@college.edu',
    studentUsername: 'student_lead_11',
    studentName: 'Student Lead 11',
    projectCode: 'PRJ-2026-011',
    projectTitle: 'AI-Based Fake News Detection',
  },
  {
    year: 3,
    section: 'B',
    advisorEmail: 'advisor.2d@college.edu',
    advisorName: 'Prof. Priya Nair',
    studentEmail: 'student.3b@college.edu',
    studentUsername: 'student_lead_13',
    studentName: 'Student Lead 13',
    projectCode: 'PRJ-2026-013',
    projectTitle: 'Smart Agriculture Monitoring Platform',
  },
  {
    year: 3,
    section: 'C',
    advisorEmail: 'advisor.3c@college.edu',
    advisorName: 'Prof. Deepa Menon',
    studentEmail: 'student.3c@college.edu',
    studentUsername: 'student_lead_15',
    studentName: 'Student Lead 15',
    projectCode: 'PRJ-2026-015',
    projectTitle: 'Emergency Ambulance Route Analyzer',
  },
  {
    year: 3,
    section: 'D',
    advisorEmail: 'advisor.3d@college.edu',
    advisorName: 'Prof. Vikram Patel',
    studentEmail: 'student.3d@college.edu',
    studentUsername: 'student_lead_17',
    studentName: 'Student Lead 17',
    projectCode: 'PRJ-2026-017',
    projectTitle: 'Local Language Translation Assistant',
  },

  // Fourth Year (4 Sections: A - D)
  {
    year: 4,
    section: 'A',
    advisorEmail: 'advisor.4a@college.edu',
    advisorName: 'Prof. Ananya Sen',
    studentEmail: 'student.4a@college.edu',
    studentUsername: 'student_lead_19',
    studentName: 'Student Lead 19',
    projectCode: 'PRJ-2026-019',
    projectTitle: 'AI-Based Plant Disease Detection',
  },
  {
    year: 4,
    section: 'B',
    advisorEmail: 'advisor.4b@college.edu',
    advisorName: 'Prof. Suresh Reddy',
    studentEmail: 'student.4b@college.edu',
    studentUsername: 'student_lead_21',
    studentName: 'Student Lead 21',
    projectCode: 'PRJ-2026-021',
    projectTitle: 'Secure File Sharing Application',
  },
  {
    year: 4,
    section: 'C',
    advisorEmail: 'advisor.4c@college.edu',
    advisorName: 'Prof. Kavita Joshi',
    studentEmail: 'student.4c@college.edu',
    studentUsername: 'student_lead_23',
    studentName: 'Student Lead 23',
    projectCode: 'PRJ-2026-023',
    projectTitle: 'Mental Wellness Resource Platform',
  },
  {
    year: 4,
    section: 'D',
    advisorEmail: 'advisor.4d@college.edu',
    advisorName: 'Prof. Arvind Swamy',
    studentEmail: 'student.4d@college.edu',
    studentUsername: 'student_lead_25',
    studentName: 'Student Lead 25',
    projectCode: 'PRJ-2026-025',
    projectTitle: 'Disaster Response Coordination System',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo selection states
  const [activeTab, setActiveTab] = useState<'selector' | 'roster'>('selector');
  const [selectedRole, setSelectedRole] = useState<'HOD' | 'MENTOR' | 'ADVISOR' | 'STUDENT'>('ADVISOR');
  const [selectedYear, setSelectedYear] = useState<number>(2);
  const [selectedSection, setSelectedSection] = useState<string>('D');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Please provide both your college email/username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(usernameOrEmail, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to authenticate. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  const getCohort = (yr: number, sec: string) => {
    return COHORTS.find((c) => c.year === yr && c.section === sec) || COHORTS[0];
  };

  const currentCohort = getCohort(selectedYear, selectedSection);

  // Apply credentials based on role, year, and section
  const applyCohortCredentials = (role: 'ADVISOR' | 'STUDENT', yr: number, sec: string) => {
    setSelectedRole(role);
    setSelectedYear(yr);
    setSelectedSection(sec);
    const target = getCohort(yr, sec);
    if (role === 'ADVISOR') {
      setDemoCredentials(target.advisorEmail, 'AdvisorPass@2026');
    } else {
      setDemoCredentials(target.studentEmail, 'StudentPass@2026');
    }
  };

  // Vice versa toggle for current year and section
  const handleViceVersa = () => {
    const nextRole = selectedRole === 'ADVISOR' ? 'STUDENT' : 'ADVISOR';
    applyCohortCredentials(nextRole, selectedYear, selectedSection);
  };

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    // Ensure section exists in new year (Year 2 has E, Years 3 & 4 have A-D)
    let validSection = selectedSection;
    if (newYear !== 2 && selectedSection === 'E') {
      validSection = 'A';
      setSelectedSection('A');
    }
    const targetRole = selectedRole === 'STUDENT' ? 'STUDENT' : 'ADVISOR';
    applyCohortCredentials(targetRole, newYear, validSection);
  };

  const handleSectionChange = (newSec: string) => {
    setSelectedSection(newSec);
    const targetRole = selectedRole === 'STUDENT' ? 'STUDENT' : 'ADVISOR';
    applyCohortCredentials(targetRole, selectedYear, newSec);
  };

  const sectionsForYear = selectedYear === 2 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-950/50 ring-4 ring-emerald-500/20 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
          Project Progress Monitoring System
        </h1>
        <p className="mt-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
          CSE Department — Academic Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-stone-50 py-7 px-6 shadow-2xl rounded-2xl sm:px-8 border border-stone-200/90">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label htmlFor="username_or_email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                College Email or Username
              </label>
              <input
                id="username_or_email"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. hod.cse@college.edu or student.2a@college.edu"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 text-stone-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 text-stone-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-md shadow-emerald-950/20"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to PPMS
            </Button>
          </form>

          {/* Demonstration Accounts Section */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            {/* Header with View Tabs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Synthetic Demonstration Accounts</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg border border-stone-300/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('selector')}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
                    activeTab === 'selector' ? 'bg-white text-emerald-800 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Interactive Year/Section Picker"
                >
                  <Sliders className="w-3 h-3 inline mr-1" />
                  Cohort Picker
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
                    activeTab === 'roster' ? 'bg-white text-emerald-800 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Complete 13-Cohort Roster"
                >
                  <LayoutGrid className="w-3 h-3 inline mr-1" />
                  All 13 Cohorts
                </button>
              </div>
            </div>

            {/* Department Roles (HOD & Mentor) */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('HOD');
                  setDemoCredentials('hod.cse@college.edu', 'HodPass@2026');
                }}
                className={`p-2.5 text-left rounded-xl border transition-all ${
                  usernameOrEmail === 'hod.cse@college.edu'
                    ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20'
                    : 'border-stone-200 bg-white hover:border-purple-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 text-xs">HOD</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                    Executive
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 block truncate mt-0.5 font-mono">hod.cse@college.edu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('MENTOR');
                  setDemoCredentials('mentor.sharma@college.edu', 'MentorPass@2026');
                }}
                className={`p-2.5 text-left rounded-xl border transition-all ${
                  usernameOrEmail === 'mentor.sharma@college.edu'
                    ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 text-xs">Mentor</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Faculty
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 block truncate mt-0.5 font-mono">mentor.sharma@college.edu</span>
              </button>
            </div>

            {/* TAB 1: INTERACTIVE COHORT PICKER WITH VICE-VERSA */}
            {activeTab === 'selector' ? (
              <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-200 space-y-3">
                {/* Role Switcher & Vice Versa Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => applyCohortCredentials('ADVISOR', selectedYear, selectedSection)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedRole === 'ADVISOR'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
                      Advisor
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCohortCredentials('STUDENT', selectedYear, selectedSection)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedRole === 'STUDENT'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Student Lead
                    </button>
                  </div>

                  {/* Vice-Versa Quick Action */}
                  <button
                    type="button"
                    onClick={handleViceVersa}
                    title="Toggle between Advisor and Student for this cohort"
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Vice Versa</span>
                  </button>
                </div>

                {/* Academic Year Selection (3 Years) */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mr-1">Year:</span>
                  {[2, 3, 4].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleYearChange(yr)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedYear === yr
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      {yr === 2 ? '2nd Year' : yr === 3 ? '3rd Year' : '4th Year'}
                    </button>
                  ))}
                </div>

                {/* Respective Section Selection */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mr-1">Section:</span>
                  {sectionsForYear.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleSectionChange(sec)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedSection === sec
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/25'
                          : 'bg-white border border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50'
                      }`}
                    >
                      Sec {sec}
                    </button>
                  ))}
                </div>

                {/* Active Selected Cohort Card with Auto-Fill Status */}
                <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-xs flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900 text-xs truncate">
                        {selectedRole === 'ADVISOR'
                          ? `Advisor (Y${selectedYear}-${selectedSection})`
                          : `Student Lead (Y${selectedYear}-${selectedSection})`}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold inline-flex items-center gap-0.5 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Loaded
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono block truncate mt-0.5">
                      {selectedRole === 'ADVISOR' ? currentCohort.advisorEmail : currentCohort.studentEmail}
                      {' • '}
                      {selectedRole === 'ADVISOR' ? currentCohort.advisorName : currentCohort.studentName}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-medium block truncate">
                      {currentCohort.projectCode}: {currentCohort.projectTitle}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRole === 'ADVISOR') {
                        setDemoCredentials(currentCohort.advisorEmail, 'AdvisorPass@2026');
                      } else {
                        setDemoCredentials(currentCohort.studentEmail, 'StudentPass@2026');
                      }
                    }}
                    className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-700 transition-colors shrink-0"
                    title="Re-fill credentials"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: COMPLETE 13-COHORT ROSTER */
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {[2, 3, 4].map((yr) => {
                  const cohortsInYear = COHORTS.filter((c) => c.year === yr);
                  return (
                    <div key={yr} className="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
                      <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                        {yr === 2 ? 'Second Year (5 Sections)' : yr === 3 ? 'Third Year (4 Sections)' : 'Fourth Year (4 Sections)'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cohortsInYear.map((c) => {
                          const isAdvActive = usernameOrEmail === c.advisorEmail;
                          const isStuActive = usernameOrEmail === c.studentEmail || usernameOrEmail === c.studentUsername;
                          return (
                            <div key={c.section} className="p-1.5 bg-white rounded-lg border border-stone-200 text-xs">
                              <div className="font-semibold text-stone-800 text-[11px] mb-1">
                                CSE-{c.section}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyCohortCredentials('ADVISOR', c.year, c.section);
                                  }}
                                  className={`flex-1 px-1.5 py-1 rounded text-[10px] font-medium border text-left truncate transition-colors ${
                                    isAdvActive
                                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                                  }`}
                                  title={`Advisor: ${c.advisorEmail} (${c.advisorName})`}
                                >
                                  🎓 Adv: {c.advisorEmail.split('@')[0]}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyCohortCredentials('STUDENT', c.year, c.section);
                                  }}
                                  className={`flex-1 px-1.5 py-1 rounded text-[10px] font-medium border text-left truncate transition-colors ${
                                    isStuActive
                                      ? 'bg-teal-700 text-white border-teal-700 font-bold'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-teal-400 hover:bg-teal-50/50'
                                  }`}
                                  title={`Student: ${c.studentEmail} (${c.studentName})`}
                                >
                                  👤 Stu: {c.studentEmail.split('@')[0]}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
