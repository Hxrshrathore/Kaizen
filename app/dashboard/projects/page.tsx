'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, Users, UserPlus, Lock, Unlock, ShieldCheck, 
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, 
  Paperclip, Send, GitBranch, PhoneCall, ExternalLink, FileText, 
  Calendar, Award, BookOpen, Layers, Check, ChevronRight,
  RefreshCw, AlertCircle, Sparkles, School, Plus, Trash2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface ProjectMember {
  id: string;
  groupId: string;
  userId?: string;
  rollNo: string;
  name: string;
  email: string;
  role: 'LEADER' | 'MEMBER';
  section?: string;
  branch?: string;
  semester?: number;
  joinedAt: string;
}

interface ProjectGroup {
  id: string;
  title: string;
  domain: string;
  projectType: 'MINOR' | 'MAJOR';
  semester: number;
  abstract?: string;
  status: 'FORMING' | 'LOCKED' | 'ALLOTTED' | 'UNDER_EVALUATION' | 'COMPLETED';
  leaderId: string;
  leaderRoll: string;
  leaderName: string;
  ficId?: string | null;
  ficName?: string | null;
  ficEmail?: string | null;
  panelId?: string | null;
  githubRepo?: string | null;
  whatsappLink?: string | null;
  isLocked: boolean;
  lockedAt?: string | null;
  allottedAt?: string | null;
  createdAt: string;
}

interface FicRequest {
  id: string;
  groupId: string;
  ficId: string;
  ficName: string;
  ficEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  requestMessage?: string;
  sentAt: string;
  expiresAt: string;
  hoursRemaining?: number;
}

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  domain: string;
  maxActiveGroups: number;
  activeSupervisedCount: number;
  isCapacityFull: boolean;
  isCoordinator?: boolean;
}

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: 'LEADER' | 'MEMBER' | 'FIC' | 'COORDINATOR';
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string;
}

interface MomRecord {
  id: string;
  meetDate: string;
  title: string;
  agenda: string;
  discussion: string;
  actionItems: string[];
  attendees: string[];
  ficSigned: boolean;
  createdAt: string;
}

interface ProjectGrade {
  id: string;
  groupId: string;
  studentRoll: string;
  studentName: string;
  internalFicMarks: number; // max 40
  panelMarks: number; // max 60
  totalMarks: number; // max 100
  gradeLetter: string;
  remarks?: string;
  evaluatedByFic?: string;
  evaluatedByPanel?: string;
}

export default function ProjectsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('team');
  const [devSemesterOverride, setDevSemesterOverride] = useState<number | null>(null);

  // Group creation modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('Artificial Intelligence & Edge Computing');
  const [newType, setNewType] = useState<'MINOR' | 'MAJOR'>('MAJOR');
  const [newAbstract, setNewAbstract] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Invite teammate
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Request FIC Modal
  const [selectedFic, setSelectedFic] = useState<FacultyMember | null>(null);
  const [proposalMessage, setProposalMessage] = useState('');

  // Chatroom
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Links state
  const [githubUrl, setGithubUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  // MOM Modal
  const [isMomModalOpen, setIsMomModalOpen] = useState(false);
  const [momTitle, setMomTitle] = useState('');
  const [momAgenda, setMomAgenda] = useState('');
  const [momDiscussion, setMomDiscussion] = useState('');
  const [momActionItems, setMomActionItems] = useState('');

  // Grading Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeInternal, setGradeInternal] = useState(38);
  const [gradePanel, setGradePanel] = useState(54);
  const [gradeRemarks, setGradeRemarks] = useState('Satisfactory architectural formulation and functional prototype demonstration.');

  // Coordinator Overview
  const [coordinatorData, setCoordinatorData] = useState<any>(null);
  const [isCoordinatorMode, setIsCoordinatorMode] = useState(false);

  // Load project portal data
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.projectData?.group) {
          setGithubUrl(json.projectData.group.githubRepo || '');
          setWhatsappUrl(json.projectData.group.whatsappLink || '');
        }
      }
    } catch (e) {
      console.error("Failed to load project portal:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  // Poll chat messages if group is allotted
  useEffect(() => {
    const groupId = data?.projectData?.group?.id;
    if (!groupId || data?.projectData?.group?.status !== 'ALLOTTED') return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/projects/workspace?groupId=${groupId}`);
        if (res.ok) {
          const json = await res.json();
          setMessages(json.messages || []);
        }
      } catch {}
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [data?.projectData?.group?.id, data?.projectData?.group?.status]);

  // Load coordinator data if tagged
  useEffect(() => {
    if (data?.user?.isCoordinator || isCoordinatorMode) {
      fetch('/api/projects/coordinator')
        .then((r) => r.json())
        .then(setCoordinatorData)
        .catch(console.error);
    }
  }, [data?.user?.isCoordinator, isCoordinatorMode]);

  // Handle student search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/projects/teammates?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.results || []);
        }
      } catch {} finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const effectiveSemester = devSemesterOverride !== null ? devSemesterOverride : (data?.semester || 7);
  const isEligible = effectiveSemester >= 6 && effectiveSemester <= 8;

  const currentGroup: ProjectGroup | null = data?.projectData?.group || null;
  const members: ProjectMember[] = data?.projectData?.members || [];
  const ficRequests: FicRequest[] = data?.projectData?.ficRequests || [];
  const moms: MomRecord[] = data?.projectData?.moms || [];
  const grades: ProjectGrade[] = data?.projectData?.grades || [];
  const facultyPool: FacultyMember[] = data?.facultyPool || [];

  // Count active pending requests (max 3 allowed)
  const activePendingRequests = ficRequests.filter((r) => r.status === 'PENDING');

  // Create Project Group Handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          domain: newDomain,
          projectType: newType,
          abstract: newAbstract,
        }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewAbstract('');
        await fetchProjectData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create group');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Teammate
  const handleAddTeammate = async (rollNo: string) => {
    if (!currentGroup) return;
    try {
      const res = await fetch('/api/projects/teammates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD',
          groupId: currentGroup.id,
          rollNo,
        }),
      });
      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
        await fetchProjectData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add teammate');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Remove Teammate
  const handleRemoveTeammate = async (memberId: string) => {
    if (!currentGroup) return;
    if (!confirm('Remove this teammate from your group?')) return;
    try {
      const res = await fetch('/api/projects/teammates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup.id,
          memberId,
        }),
      });
      if (res.ok) {
        await fetchProjectData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove teammate');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Lock Teammates
  const handleLockTeam = async () => {
    if (!currentGroup) return;
    if (members.length < 2) {
      alert('A minimum of 2 team members is required before locking your roster.');
      return;
    }
    if (members.length > 4) {
      alert('A maximum of 4 members is permitted.');
      return;
    }
    if (!confirm('CONFIRM ROSTER LOCK:\nOnce locked, teammates CANNOT be changed or removed. You will proceed to Faculty Supervision Requests. Proceed?')) {
      return;
    }
    try {
      const res = await fetch('/api/projects/teammates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOCK',
          groupId: currentGroup.id,
        }),
      });
      if (res.ok) {
        await fetchProjectData();
        setActiveTab('faculty');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to lock team');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Send FIC Request
  const handleSendFicRequest = async () => {
    if (!currentGroup || !selectedFic) return;
    if (activePendingRequests.length >= 3) {
      alert('You already have 3 active pending requests. Maximum 3 pending requests allowed per group.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/projects/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup.id,
          ficId: selectedFic.id,
          message: proposalMessage,
        }),
      });
      if (res.ok) {
        setSelectedFic(null);
        setProposalMessage('');
        await fetchProjectData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send request');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate or Process FIC Action (Accept/Reject)
  const handleFicResponse = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch('/api/projects/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });
      if (res.ok) {
        await fetchProjectData();
        if (action === 'ACCEPT') {
          setActiveTab('workspace');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Operation failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Save Links (GitHub & WhatsApp)
  const handleSaveLinks = async () => {
    if (!currentGroup) return;
    try {
      setIsSavingLinks(true);
      const res = await fetch('/api/projects/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_LINKS',
          groupId: currentGroup.id,
          githubRepo: githubUrl,
          whatsappLink: whatsappUrl,
        }),
      });
      if (res.ok) {
        alert('Project GitHub repository and WhatsApp links saved.');
        await fetchProjectData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSavingLinks(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !chatInput.trim()) return;
    try {
      setIsSendingMessage(true);
      const res = await fetch('/api/projects/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          groupId: currentGroup.id,
          message: chatInput.trim(),
          role: currentGroup.leaderRoll === data?.rollNo ? 'LEADER' : 'MEMBER',
        }),
      });
      if (res.ok) {
        setChatInput('');
        const msgRes = await fetch(`/api/projects/workspace?groupId=${currentGroup.id}`);
        if (msgRes.ok) {
          const json = await msgRes.json();
          setMessages(json.messages || []);
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Record MOM
  const handleAddMom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !momTitle || !momAgenda) return;
    try {
      const res = await fetch('/api/projects/mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup.id,
          meetDate: new Date().toISOString().split('T')[0],
          title: momTitle,
          agenda: momAgenda,
          discussion: momDiscussion,
          actionItems: momActionItems.split('\n').filter(Boolean),
          attendees: members.map((m) => `${m.name} (${m.rollNo})`),
          ficSigned: true,
        }),
      });
      if (res.ok) {
        setIsMomModalOpen(false);
        setMomTitle('');
        setMomAgenda('');
        setMomDiscussion('');
        setMomActionItems('');
        await fetchProjectData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Submit Evaluation Grades
  const handleSubmitGrades = async () => {
    if (!currentGroup || members.length === 0) return;
    try {
      for (const m of members) {
        await fetch('/api/projects/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: currentGroup.id,
            studentRoll: m.rollNo,
            studentName: m.name,
            internalMarks: gradeInternal,
            panelMarks: gradePanel,
            evaluatorRole: 'FIC',
            evaluatorName: currentGroup.ficName || 'Dr. A. K. Ray',
            remarks: gradeRemarks,
          }),
        });
      }
      setIsGradeModalOpen(false);
      await fetchProjectData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-mono text-xs">
        <RefreshCw className="animate-spin text-primary" size={24} />
        <span className="text-muted-foreground uppercase tracking-wider">Loading Autonomous Project Engine...</span>
      </div>
    );
  }

  // --- ACADEMIC RESTRICTION: Semesters 1 to 5 are strictly locked ---
  if (!isEligible) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
          <CardHeader className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-500">
              <Lock size={32} />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-mono uppercase tracking-wider text-amber-500">
              Academic Curricular Gate: Access Restricted
            </CardTitle>
            <CardDescription className="max-w-xl mx-auto text-sm text-muted-foreground mt-2 font-sans">
              The Minor & Major Project Portal is strictly provisioned for <strong className="text-foreground">Semester 6, 7, and 8 students</strong> of KIIT Autonomous University.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg mx-auto text-xs font-mono">
            <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Current Enrolled Standing:</span>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-bold">
                Semester {effectiveSemester}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Eligible Curricular Phases:</span>
              <span className="text-foreground font-bold">Semester 6 (Minor), 7 & 8 (Major I & II)</span>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Your academic standing will automatically unlock project allotment upon entering the 6th semester curriculum.
            </p>

            {/* Developer Testing Override */}
            <div className="pt-4 border-t border-border/60 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2">Simulate Senior Semester for Evaluation:</span>
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setDevSemesterOverride(6)} className="text-xs font-mono">
                  Test Sem 6 (Minor)
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDevSemesterOverride(7)} className="text-xs font-mono">
                  Test Sem 7 (Major I)
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDevSemesterOverride(8)} className="text-xs font-mono">
                  Test Sem 8 (Major II)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Protocol Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <FolderKanban size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-wide text-foreground">
                Autonomous Project Portal
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                Semester {effectiveSemester} ({effectiveSemester === 6 ? 'Minor Project' : 'Major Project'})
              </Badge>
              {currentGroup?.isLocked && (
                <Badge variant="secondary" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 gap-1">
                  <Lock size={10} /> Roster Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Official KIIT Autonomous Curriculum // Max 3 groups per FIC // Evaluation: 40 Internal + 60 Panel
            </p>
          </div>
        </div>

        {/* Quick Action Badges / Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {data?.user?.isCoordinator && (
            <Button
              size="sm"
              variant={isCoordinatorMode ? 'default' : 'outline'}
              onClick={() => setIsCoordinatorMode(!isCoordinatorMode)}
              className="gap-1.5 text-xs font-mono"
            >
              <ShieldCheck size={14} />
              <span>{isCoordinatorMode ? 'Exit Coordinator Hub' : 'Coordinator Protocol Hub'}</span>
            </Button>
          )}

          {/* Dev Semester Switcher */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border text-[10px] font-mono">
            <span className="px-1 text-muted-foreground">Sem:</span>
            {[6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setDevSemesterOverride(s)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  effectiveSemester === s ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl border border-border grid grid-cols-2 sm:grid-cols-5 gap-1 h-auto font-mono text-xs">
          <TabsTrigger value="team" className="gap-1.5 py-2">
            <Users size={14} />
            <span>1. Team Formation</span>
            {members.length > 0 && <span className="opacity-70 text-[10px]">({members.length}/4)</span>}
          </TabsTrigger>

          <TabsTrigger 
            value="faculty" 
            className="gap-1.5 py-2"
            disabled={!currentGroup}
          >
            <School size={14} />
            <span>2. Supervisor Pool</span>
            {activePendingRequests.length > 0 && (
              <Badge className="h-4 px-1 text-[9px] bg-primary text-primary-foreground ml-1">
                {activePendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger 
            value="workspace" 
            className="gap-1.5 py-2"
            disabled={!currentGroup || currentGroup.status === 'FORMING'}
          >
            <MessageSquare size={14} />
            <span>3. Workspace & Chat</span>
          </TabsTrigger>

          <TabsTrigger 
            value="evaluation" 
            className="gap-1.5 py-2"
            disabled={!currentGroup}
          >
            <Award size={14} />
            <span>4. Grading (40+60)</span>
          </TabsTrigger>

          {data?.user?.isCoordinator && (
            <TabsTrigger value="coordinator" className="gap-1.5 py-2 text-primary font-bold">
              <ShieldCheck size={14} />
              <span>5. Coordinator Hub</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* =========================================================================
            TAB 1: TEAM FORMATION & TEAMMATE FINDER
           ========================================================================= */}
        <TabsContent value="team" className="space-y-6">
          {!currentGroup ? (
            /* No Group Created: Offer Group Creation or Teammate Search */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-2">
                    <UserPlus size={24} />
                  </div>
                  <CardTitle className="text-lg font-mono">Create Project Group</CardTitle>
                  <CardDescription className="text-xs">
                    Register as Team Leader. Form a team of 2 to 4 members to request faculty supervision.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Team Leader Roll Number</label>
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border font-bold text-foreground">
                      {data?.rollNo || '22051867'} — {data?.user?.name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Curricular Classification</label>
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-foreground">
                      Semester {effectiveSemester} // {effectiveSemester === 6 ? 'Minor Project' : 'Major Project Phase I/II'}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="w-full gap-2 font-mono font-bold"
                  >
                    <Plus size={16} />
                    <span>Initialize Project Group</span>
                  </Button>
                </CardFooter>
              </Card>

              {/* Teammate Recruitment Board */}
              <Card className="border-border bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-2">
                    <Users size={24} />
                  </div>
                  <CardTitle className="text-lg font-mono">Teammate Finder Board</CardTitle>
                  <CardDescription className="text-xs">
                    Browse open student project groups looking for teammates with complementary skills.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.recruitmentBoard?.length > 0 ? (
                    data.recruitmentBoard.map((post: any) => (
                      <div key={post.id} className="p-3 rounded-xl border border-border bg-muted/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{post.title}</span>
                          <Badge variant="outline" className="text-[10px] font-mono text-primary">
                            {post.openSlots} Open Slots
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{post.domain}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {post.skills?.map((s: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-xs font-mono">
                      No open recruitment posts currently. Create your group to post looking for teammates.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Group Created: Show Group Roster & Management */
            <div className="space-y-6">
              {/* Group Overview Banner */}
              <Card className="border-primary/30 bg-card/70 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg sm:text-xl font-mono text-foreground">
                          {currentGroup.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                          {currentGroup.projectType} PROJECT
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Domain: <strong className="text-foreground">{currentGroup.domain}</strong> // Academic Year 2026-27
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {currentGroup.isLocked ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold">
                          <Lock size={14} />
                          <span>TEAMMATES LOCKED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono font-bold">
                          <Unlock size={14} />
                          <span>ROSTER UNLOCKED ({members.length}/4)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {currentGroup.abstract && (
                    <p className="text-xs text-muted-foreground/90 bg-muted/30 p-3 rounded-xl border border-border/50">
                      {currentGroup.abstract}
                    </p>
                  )}

                  {/* Teammate Roster Grid (Min 2, Max 4) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Official Team Roster ({members.length} of 4 Members)
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Min 2 • Max 4 Members
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {members.map((member) => (
                        <div 
                          key={member.id} 
                          className="p-3 rounded-xl border border-border bg-card/80 flex flex-col justify-between gap-2 shadow-sm relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary">
                              {member.name.charAt(0)}
                            </div>
                            <Badge 
                              variant={member.role === 'LEADER' ? 'default' : 'outline'} 
                              className="text-[9px] font-mono"
                            >
                              {member.role}
                            </Badge>
                          </div>

                          <div>
                            <div className="font-bold text-xs text-foreground truncate">{member.name}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{member.rollNo}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{member.section || 'ECS GROUP-03'}</div>
                          </div>

                          {!currentGroup.isLocked && member.role !== 'LEADER' && (
                            <button
                              onClick={() => handleRemoveTeammate(member.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors text-[10px] font-mono flex items-center gap-1 mt-1 pt-1 border-t border-border/40"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Empty Slot Placeholder */}
                      {Array.from({ length: Math.max(0, 4 - members.length) }).map((_, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-xl border border-dashed border-border/70 flex flex-col items-center justify-center text-center text-muted-foreground gap-1.5 min-h-[110px]"
                        >
                          <Users size={16} className="opacity-40" />
                          <span className="text-[11px] font-mono">Empty Slot</span>
                          <span className="text-[9px] text-muted-foreground/60">
                            {members.length + idx + 1 <= 2 ? 'Required (Min 2)' : 'Optional'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teammate Invitation & Search Panel (Only if Unlocked) */}
                  {!currentGroup.isLocked && members.length < 4 && (
                    <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-foreground">
                          Invite Teammates via Roll Number or Name
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Directory Autocomplete
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Type KIIT Roll Number (e.g. 22051868) or Student Name..."
                          className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs font-mono focus:outline-none focus:border-primary/50"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-2.5">
                            <RefreshCw size={14} className="animate-spin text-muted-foreground" />
                          </div>
                        )}

                        {/* Search Autocomplete Dropdown */}
                        {searchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-border bg-card shadow-xl p-2 max-h-48 overflow-y-auto space-y-1">
                            {searchResults.map((st) => (
                              <div
                                key={st.rollNo}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted text-xs cursor-pointer"
                                onClick={() => handleAddTeammate(st.rollNo)}
                              >
                                <div>
                                  <span className="font-bold text-foreground">{st.name}</span>
                                  <span className="ml-2 font-mono text-muted-foreground">({st.rollNo})</span>
                                  <span className="ml-2 text-[10px] text-muted-foreground">{st.section}</span>
                                </div>
                                <Button size="sm" variant="ghost" className="h-7 text-xs font-mono text-primary gap-1">
                                  <Plus size={12} /> Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lock Teammates CTA */}
                  {!currentGroup.isLocked && (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle size={15} className="text-amber-500 shrink-0" />
                        <span>
                          Once minimum 2 members join, lock your team mates to request faculty supervision.
                        </span>
                      </div>
                      <Button
                        onClick={handleLockTeam}
                        disabled={members.length < 2}
                        className="font-mono font-bold text-xs gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Lock size={14} />
                        <span>Lock Teammates ({members.length}/4)</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 2: FACULTY SUPERVISION POOL & REQUESTS
           ========================================================================= */}
        <TabsContent value="faculty" className="space-y-6">
          {/* Active Pending Requests Alert */}
          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h3 className="text-sm font-bold font-mono text-foreground">
                  Faculty Supervision Requests ({activePendingRequests.length} of 3 Allowed Active)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Auto-rejection rule: Ignored requests automatically expire in 3 days (72 hours)
              </span>
            </div>

            {ficRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ficRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className={`p-3 rounded-xl border text-xs space-y-2 relative ${
                      req.status === 'ACCEPTED' 
                        ? 'border-emerald-500/40 bg-emerald-500/5' 
                        : req.status === 'PENDING'
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-border bg-muted/20 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{req.ficName}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] font-mono ${
                          req.status === 'ACCEPTED' ? 'text-emerald-500 border-emerald-500/40' :
                          req.status === 'PENDING' ? 'text-amber-500 border-amber-500/40' : 'text-muted-foreground'
                        }`}
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="text-[10px] font-mono text-muted-foreground">
                      {req.ficEmail}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-amber-500 pt-1 border-t border-border/40">
                        <span>Auto-rejects in:</span>
                        <span className="font-bold">
                          {req.hoursRemaining && req.hoursRemaining > 0 
                            ? `${Math.floor(req.hoursRemaining / 24)}d ${req.hoursRemaining % 24}h remaining` 
                            : 'Expires in 72h'}
                        </span>
                      </div>
                    )}

                    {/* Developer / Faculty Test Simulator */}
                    {req.status === 'PENDING' && (
                      <div className="pt-2 border-t border-border/40 flex items-center gap-1.5">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleFicResponse(req.id, 'ACCEPT')}
                          className="h-7 text-[10px] font-mono text-emerald-500 hover:bg-emerald-500/10 flex-1"
                        >
                          Simulate Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleFicResponse(req.id, 'REJECT')}
                          className="h-7 text-[10px] font-mono text-rose-400 hover:bg-rose-500/10 flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-xs font-mono">
                No supervision requests sent yet. Choose an available faculty member below to request mentorship.
              </div>
            )}
          </div>

          {/* Faculty Pool Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-mono text-foreground">
                  Available Faculty In-Charges (FIC Pool)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official Supervisors // Quota strictly limited to maximum 3 groups per faculty
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {facultyPool.length} Faculty Listed
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {facultyPool.map((fic) => {
                const isAllottedHere = currentGroup?.ficId === fic.id;
                const isRequested = ficRequests.some((r) => r.ficId === fic.id && r.status === 'PENDING');

                return (
                  <Card 
                    key={fic.id} 
                    className={`flex flex-col justify-between border transition-all ${
                      isAllottedHere 
                        ? 'border-emerald-500/50 bg-emerald-500/5 shadow-md ring-1 ring-emerald-500/30' 
                        : fic.isCapacityFull 
                        ? 'border-border/50 bg-muted/20 opacity-75' 
                        : 'border-border bg-card/70 hover:border-primary/40'
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-sm">
                          {fic.name.replace('Dr. ', '').replace('Prof. ', '').charAt(0)}
                        </div>
                        {fic.isCoordinator && (
                          <Badge variant="secondary" className="text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            Coordinator
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground mt-2 truncate">
                        {fic.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] truncate">
                        {fic.designation}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-[10px] text-muted-foreground">
                        <strong className="text-foreground block truncate">Domain:</strong>
                        <span className="line-clamp-2">{fic.domain}</span>
                      </div>

                      {/* Quota Indicator */}
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-muted-foreground">Supervision Quota:</span>
                        <span className={`font-bold ${fic.isCapacityFull ? 'text-rose-400' : 'text-emerald-500'}`}>
                          {fic.activeSupervisedCount} / {fic.maxActiveGroups} Groups
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      {isAllottedHere ? (
                        <Button disabled size="sm" className="w-full bg-emerald-500 text-white text-xs font-mono">
                          <CheckCircle2 size={13} className="mr-1" /> Allotted Supervisor
                        </Button>
                      ) : isRequested ? (
                        <Button disabled size="sm" variant="outline" className="w-full text-xs font-mono text-amber-500 border-amber-500/40">
                          <Clock size={13} className="mr-1" /> Request Pending
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={
                            !currentGroup?.isLocked || 
                            fic.isCapacityFull || 
                            activePendingRequests.length >= 3 || 
                            Boolean(currentGroup?.ficId)
                          }
                          onClick={() => {
                            setSelectedFic(fic);
                            setProposalMessage(`Respected ${fic.name}, our team (${currentGroup?.title}) requests your supervision in ${currentGroup?.domain}.`);
                          }}
                          className="w-full text-xs font-mono"
                          variant="outline"
                        >
                          Request Mentorship
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            TAB 3: DEDICATED WORKSPACE & CHATROOM (5 PARTICIPANTS)
           ========================================================================= */}
        <TabsContent value="workspace" className="space-y-6">
          {currentGroup?.status !== 'ALLOTTED' && !currentGroup?.ficId ? (
            <Card className="border-border p-8 text-center">
              <Lock size={32} className="mx-auto text-muted-foreground mb-3 opacity-60" />
              <CardTitle className="text-base font-mono">Project Workspace Locked</CardTitle>
              <CardDescription className="text-xs max-w-md mx-auto mt-1">
                The 5-participant real-time collaboration workspace (4 teammates + 1 Faculty In-Charge) unlocks once an official supervisor accepts your project request.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Repository & WhatsApp Links + MOM Tracker */}
              <div className="space-y-6 lg:col-span-1">
                {/* Repository & Links Card */}
                <Card className="border-border bg-card/70 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono flex items-center gap-2">
                      <FolderKanban size={16} className="text-primary" />
                      <span>Project Collaboration Links</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-muted-foreground flex items-center gap-1.5">
                        <GitBranch size={13} />
                        <span>GitHub Repository URL</span>
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/organization/repo"
                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono focus:outline-none focus:border-primary/50"
                      />
                      {githubUrl && (
                        <a 
                          href={githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 pt-0.5"
                        >
                          <ExternalLink size={10} /> Open Repository
                        </a>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-muted-foreground flex items-center gap-1.5">
                        <PhoneCall size={13} />
                        <span>WhatsApp Group Invite Link</span>
                      </label>
                      <input
                        type="url"
                        value={whatsappUrl}
                        onChange={(e) => setWhatsappUrl(e.target.value)}
                        placeholder="https://chat.whatsapp.com/invite/..."
                        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono focus:outline-none focus:border-primary/50"
                      />
                      {whatsappUrl && (
                        <a 
                          href={whatsappUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1 pt-0.5"
                        >
                          <ExternalLink size={10} /> Join WhatsApp Group
                        </a>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      size="sm" 
                      onClick={handleSaveLinks} 
                      disabled={isSavingLinks}
                      className="w-full text-xs font-mono"
                    >
                      {isSavingLinks ? 'Saving...' : 'Sync Project Links'}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Minutes of Meeting (MOM) Tracker */}
                <Card className="border-border bg-card/70 backdrop-blur-xl">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-mono flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span>Minutes of Meeting (MOM)</span>
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Required for 40 Internal Marks
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsMomModalOpen(true)}
                      className="h-7 text-xs font-mono gap-1"
                    >
                      <Plus size={12} /> Record MOM
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2.5 max-h-72 overflow-y-auto">
                    {moms.length > 0 ? (
                      moms.map((mom) => (
                        <div key={mom.id} className="p-2.5 rounded-xl border border-border bg-muted/30 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground truncate">{mom.title}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{mom.meetDate}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{mom.agenda}</p>
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/40 font-mono">
                            <span className="text-muted-foreground">{mom.attendees?.length || 4} Attendees</span>
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <CheckCircle2 size={10} /> FIC Verified
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-xs font-mono">
                        No meeting minutes recorded yet. Convene a meet with your FIC and log the agenda.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Real-Time Chatroom for 5 Participants */}
              <div className="lg:col-span-2">
                <Card className="border-border bg-card/80 backdrop-blur-xl flex flex-col h-[600px]">
                  <CardHeader className="p-4 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <CardTitle className="text-sm font-mono text-foreground">
                          Project Chatroom // 5 Participants
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">Leader</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">Supervisor FIC</span>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Message Stream */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length > 0 ? (
                      messages.map((msg) => {
                        const isFic = msg.senderRole === 'FIC';
                        const isLeader = msg.senderRole === 'LEADER';

                        return (
                          <div 
                            key={msg.id} 
                            className={`p-3 rounded-2xl max-w-[85%] space-y-1 text-xs ${
                              isFic 
                                ? 'bg-emerald-500/10 border border-emerald-500/25 ml-auto text-foreground'
                                : isLeader
                                ? 'bg-primary/10 border border-primary/25 text-foreground'
                                : 'bg-muted border border-border text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                              <span className="font-bold flex items-center gap-1">
                                {msg.senderName}
                                <span className={`px-1 py-0.2 rounded text-[8px] uppercase ${
                                  isFic ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {msg.senderRole}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs leading-relaxed">{msg.message}</p>

                            {msg.attachmentName && (
                              <div className="mt-2 p-2 rounded-lg bg-card border border-border flex items-center justify-between text-[11px] font-mono">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Paperclip size={13} className="text-primary" />
                                  <span className="truncate">{msg.attachmentName}</span>
                                </div>
                                <span className="text-[9px] uppercase px-1 bg-muted rounded">
                                  {msg.attachmentType || 'DOC'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono gap-2">
                        <MessageSquare size={24} className="opacity-40" />
                        <span>Chatroom initialized. Send a greeting to your allotted supervisor.</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </CardContent>

                  {/* Input Bar */}
                  <CardFooter className="p-3 border-t border-border shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        title="Attach Project Document (PDF/PPT/Code)"
                        onClick={() => {
                          const docName = prompt("Enter simulated document file name (e.g. System_Design_Report.pdf):", "System_Architecture_Spec.pdf");
                          if (docName) {
                            setChatInput((prev) => `${prev ? prev + ' ' : ''}[Attached: ${docName}]`);
                          }
                        }}
                      >
                        <Paperclip size={16} />
                      </Button>

                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Discuss milestones, send attachments, or ask questions..."
                        className="flex-1 px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:outline-none focus:border-primary/50"
                      />

                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={isSendingMessage || !chatInput.trim()}
                        className="h-9 px-3 gap-1 font-mono font-bold"
                      >
                        <Send size={14} />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </div>

            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 4: GRADING & EVALUATION SCHEME (40+60 = 100 MARKS)
           ========================================================================= */}
        <TabsContent value="evaluation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 40 Marks Internal Supervisor Rubric */}
            <Card className="border-border bg-card/70 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-mono border-primary/40 text-primary mb-1">
                  INTERNAL COMPONENT
                </Badge>
                <CardTitle className="text-base font-mono">40 Marks // Supervisor Evaluation</CardTitle>
                <CardDescription className="text-xs">
                  Awarded continuously by the allotted Faculty In-Charge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Regularity & Weekly Meets</span>
                  <span className="font-bold text-foreground">10 Marks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Minutes of Meeting (MOM)</span>
                  <span className="font-bold text-foreground">10 Marks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Implementation Progress</span>
                  <span className="font-bold text-foreground">10 Marks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Preliminary Report & Git Code</span>
                  <span className="font-bold text-foreground">10 Marks</span>
                </div>
              </CardContent>
            </Card>

            {/* 60 Marks External Panel Rubric */}
            <Card className="border-border bg-card/70 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-mono border-purple-500/40 text-purple-400 mb-1">
                  EXTERNAL COMPONENT
                </Badge>
                <CardTitle className="text-base font-mono">60 Marks // Panel Examination</CardTitle>
                <CardDescription className="text-xs">
                  Awarded by external FICs in the appointed evaluation panel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Problem Formulation & Novelty</span>
                  <span className="font-bold text-foreground">15 Marks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>System Architecture & Rigor</span>
                  <span className="font-bold text-foreground">15 Marks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Demonstration & Code Quality</span>
                  <span className="font-bold text-foreground">15 Marks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span>Viva Voce & Panel Defense</span>
                  <span className="font-bold text-foreground">15 Marks</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Consolidated Grade Card */}
            <Card className="border-primary/40 bg-card/80 backdrop-blur-xl flex flex-col justify-between">
              <CardHeader className="pb-2">
                <Badge className="w-fit text-[10px] font-mono bg-primary text-primary-foreground mb-1">
                  100 MARKS TOTAL
                </Badge>
                <CardTitle className="text-base font-mono">Consolidated Academic Ledger</CardTitle>
                <CardDescription className="text-xs">
                  Weighted sum under official university autonomous regulations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border text-center space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Current Standing</span>
                  <div className="text-3xl font-mono font-bold text-foreground">
                    {grades.length > 0 ? grades[0].totalMarks : 92} <span className="text-sm text-muted-foreground font-normal">/ 100</span>
                  </div>
                  <Badge variant="secondary" className="font-mono font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    Grade: {grades.length > 0 ? grades[0].gradeLetter : 'O (Outstanding)'}
                  </Badge>
                </div>

                <div className="text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Supervisor Component:</span>
                    <strong className="text-foreground">{grades.length > 0 ? grades[0].internalFicMarks : 38} / 40</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Panel Examination:</span>
                    <strong className="text-foreground">{grades.length > 0 ? grades[0].panelMarks : 54} / 60</strong>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsGradeModalOpen(true)}
                  className="w-full text-xs font-mono"
                >
                  Enter / Update Marks
                </Button>
              </CardFooter>
            </Card>

          </div>
        </TabsContent>

        {/* =========================================================================
            TAB 5: COORDINATOR PROTOCOL HUB (FULL CRUD & PANELS)
           ========================================================================= */}
        {data?.user?.isCoordinator && (
          <TabsContent value="coordinator" className="space-y-6">
            <Card className="border-purple-500/30 bg-purple-500/5 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-purple-400" />
                  <CardTitle className="text-base font-mono text-foreground">
                    Project Coordinator Governance Engine // Full Protocol CRUD
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Full authority to override team locks, reassign supervisor FICs, and apportion student groups across Evaluation Panels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* 3 to 4 Evaluation Panels Configured */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Evaluation Panels (Apportioned & Planned by Coordinator)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coordinatorData?.panels?.map((panel: any) => (
                      <div key={panel.id} className="p-3.5 rounded-xl border border-border bg-card/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground font-mono">{panel.name}</span>
                          <Badge variant="outline" className="text-[9px] font-mono text-purple-400 border-purple-500/30">
                            Panel {panel.panelNumber}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{panel.domain}</p>
                        <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                          <span>Venue: <strong className="text-foreground">{panel.venue}</strong></span>
                          <span>{panel.scheduledDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Groups Master Table */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    All Enrolled Project Groups ({coordinatorData?.groups?.length || 0})
                  </h4>
                  <div className="border border-border rounded-xl overflow-hidden bg-card/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-muted/50 border-b border-border text-[10px] uppercase text-muted-foreground">
                        <tr>
                          <th className="p-3">Project Title</th>
                          <th className="p-3">Leader</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Allotted FIC</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {coordinatorData?.groups?.map((g: any) => (
                          <tr key={g.id} className="hover:bg-muted/30">
                            <td className="p-3 font-bold text-foreground">{g.title}</td>
                            <td className="p-3 text-muted-foreground">{g.leaderRoll} ({g.leaderName})</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[9px]">
                                {g.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{g.ficName || 'Unassigned'}</td>
                            <td className="p-3 text-right space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] font-mono"
                                onClick={async () => {
                                  const ficPrompt = prompt("Reassign to which FIC ID? (e.g. fic-akray, fic-sksabut, fic-mdas):", "fic-akray");
                                  if (ficPrompt) {
                                    await fetch('/api/projects/coordinator', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'REASSIGN_FIC',
                                        groupId: g.id,
                                        newFicId: ficPrompt,
                                      }),
                                    });
                                    alert('FIC reassigned.');
                                    fetch('/api/projects/coordinator').then(r => r.json()).then(setCoordinatorData);
                                  }
                                }}
                              >
                                Reassign FIC
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* =========================================================================
          MODALS & DIALOGS
         ========================================================================= */}

      {/* Create Project Group Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">Initialize Project Group</DialogTitle>
            <DialogDescription className="text-xs">
              Semester {effectiveSemester} {effectiveSemester === 6 ? 'Minor Project' : 'Major Project'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-muted-foreground">Project Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Autonomous AI Proctoring Engine with Edge Vision"
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Domain / Research Track *</label>
              <select
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:border-primary/50"
              >
                <option value="Artificial Intelligence & Edge Computing">Artificial Intelligence & Edge Computing</option>
                <option value="Embedded Systems & Cyber-Physical IoT">Embedded Systems & Cyber-Physical IoT</option>
                <option value="VLSI Design & Digital CMOS Architecture">VLSI Design & Digital CMOS Architecture</option>
                <option value="Biomedical Signal & Healthcare Diagnostics">Biomedical Signal & Healthcare Diagnostics</option>
                <option value="Cyber Security & Quantum Cryptography">Cyber Security & Quantum Cryptography</option>
                <option value="Cloud Architecture & Distributed Systems">Cloud Architecture & Distributed Systems</option>
                <option value="Autonomous Robotics & Control">Autonomous Robotics & Control</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Curricular Classification</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:border-primary/50"
              >
                <option value="MAJOR">Major Project (7th/8th Semester)</option>
                <option value="MINOR">Minor Project (6th Semester)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Brief Abstract / Objectives</label>
              <textarea
                rows={3}
                value={newAbstract}
                onChange={(e) => setNewAbstract(e.target.value)}
                placeholder="State the problem statement, hardware/software stack, and expected outcomes..."
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:border-primary/50"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="text-xs font-mono">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !newTitle.trim()} className="text-xs font-mono font-bold">
                {isSubmitting ? 'Creating...' : 'Register Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request FIC Supervision Modal */}
      <Dialog open={Boolean(selectedFic)} onOpenChange={(open) => !open && setSelectedFic(null)}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">Request Faculty Supervision</DialogTitle>
            <DialogDescription className="text-xs">
              Sending official mentorship request to {selectedFic?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="font-bold text-foreground">{selectedFic?.name}</div>
              <div className="text-[11px] text-muted-foreground">{selectedFic?.designation}</div>
              <div className="text-[10px] text-primary">{selectedFic?.domain}</div>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Proposal Statement / Note to Faculty</label>
              <textarea
                rows={3}
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 space-y-1">
              <div className="font-bold">Important Autonomous Rules:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Max 3 active pending requests permitted at one time.</li>
                <li>Faculty member can supervise at most 3 groups.</li>
                <li>If unreviewed, this request will auto-reject in 3 days (72 hours).</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setSelectedFic(null)} className="text-xs font-mono">
              Cancel
            </Button>
            <Button onClick={handleSendFicRequest} disabled={isSubmitting} className="text-xs font-mono font-bold">
              {isSubmitting ? 'Sending...' : 'Transmit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Minutes of Meeting (MOM) Record Dialog */}
      <Dialog open={isMomModalOpen} onOpenChange={setIsMomModalOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">Record Minutes of Meeting (MOM)</DialogTitle>
            <DialogDescription className="text-xs">
              Official meet documentation verified by Faculty In-Charge
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMom} className="space-y-3 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-muted-foreground">Meeting Title *</label>
              <input
                type="text"
                required
                value={momTitle}
                onChange={(e) => setMomTitle(e.target.value)}
                placeholder="e.g. Milestone 1: Architectural Validation"
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Meeting Agenda *</label>
              <input
                type="text"
                required
                value={momAgenda}
                onChange={(e) => setMomAgenda(e.target.value)}
                placeholder="Review schematic, discuss FPGA clock constraints"
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Discussion Points & Technical Decisions</label>
              <textarea
                rows={2}
                value={momDiscussion}
                onChange={(e) => setMomDiscussion(e.target.value)}
                placeholder="Supervisor advised using edge inference with quantization..."
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Action Items (One per line)</label>
              <textarea
                rows={2}
                value={momActionItems}
                onChange={(e) => setMomActionItems(e.target.value)}
                placeholder="Finalize data pipeline by Friday&#10;Implement RTL module"
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsMomModalOpen(false)} className="text-xs font-mono">
                Cancel
              </Button>
              <Button type="submit" className="text-xs font-mono font-bold">
                Save & Stamp MOM
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enter / Update Grades Modal */}
      <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">Grading Rubric Assessment</DialogTitle>
            <DialogDescription className="text-xs">
              40 Marks (Internal Supervisor) + 60 Marks (External Panel) = 100 Total
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-muted-foreground">Internal Supervisor Marks (Max 40)</label>
                <span className="font-bold text-primary">{gradeInternal} / 40</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={gradeInternal}
                onChange={(e) => setGradeInternal(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-muted-foreground">External Panel Marks (Max 60)</label>
                <span className="font-bold text-purple-400">{gradePanel} / 60</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={gradePanel}
                onChange={(e) => setGradePanel(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
              <span className="font-bold text-foreground">Total Score:</span>
              <span className="text-base font-bold text-emerald-500 font-mono">
                {gradeInternal + gradePanel} / 100 ({gradeInternal + gradePanel >= 90 ? 'Grade O' : gradeInternal + gradePanel >= 80 ? 'Grade E' : 'Grade A'})
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">Examiner Remarks</label>
              <textarea
                rows={2}
                value={gradeRemarks}
                onChange={(e) => setGradeRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsGradeModalOpen(false)} className="text-xs font-mono">
              Cancel
            </Button>
            <Button onClick={handleSubmitGrades} className="text-xs font-mono font-bold">
              Commit Grades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
