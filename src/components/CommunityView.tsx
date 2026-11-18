import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  EyeOff,
  Flag,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  ChatMessage,
  ConsentSettings,
  GroupEvent,
  NearbyPerson,
  WalkingGroup,
  WeeklyChallenge,
} from '../types';

interface CommunityViewProps {
  userName: string;
  consent: ConsentSettings;
  groups: WalkingGroup[];
  events: GroupEvent[];
  challenge: WeeklyChallenge;
  nearbyPeople: NearbyPerson[];
  messages: ChatMessage[];
  onRefresh: () => Promise<void>;
}

const getDefaultEventDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const CommunityView: React.FC<CommunityViewProps> = ({
  userName,
  consent,
  groups,
  events,
  challenge,
  nearbyPeople,
  messages,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'groups' | 'nearby' | 'chat'>('groups');
  const [eventTitle, setEventTitle] = useState('');
  const [eventSpot, setEventSpot] = useState('Үндэсний цэцэрлэгт хүрээлэнгийн Төв хаалга');
  const [eventTime, setEventTime] = useState('Ням · 09:00');
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || 'grp-park-morning');
  const [activeChannelId, setActiveChannelId] = useState(groups.find((g) => g.joined)?.id || '');
  const [chatInput, setChatInput] = useState('');
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDate, setProposalDate] = useState(getDefaultEventDate);
  const [proposalTime, setProposalTime] = useState('09:00');
  const [selectedEventMsgId, setSelectedEventMsgId] = useState<string | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Зохисгүй харилцаа эсвэл спам');
  const [notice, setNotice] = useState<string | null>(null);
  const chatFeedRef = useRef<HTMLDivElement | null>(null);

  const joinedGroups = groups.filter((g) => g.joined);
  const connectedPeople = nearbyPeople.filter((p) => p.mutualConsent === 'connected');

  useEffect(() => {
    const validIds = new Set([...joinedGroups.map((g) => g.id), ...connectedPeople.map((p) => p.id)]);
    if (!validIds.has(activeChannelId)) {
      setActiveChannelId(joinedGroups[0]?.id || connectedPeople[0]?.id || '');
    }
  }, [joinedGroups, connectedPeople, activeChannelId]);

  useEffect(() => {
    if (subTab === 'chat' && chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [subTab, activeChannelId, messages.length]);

  const updateConsent = async (patch: Partial<ConsentSettings>) => {
    await fetch('/api/user/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await onRefresh();
  };

  if (!consent.communityJoined) {
    return (
      <div className="p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <Users className="mx-auto h-9 w-9 text-slate-400" />
          <h1 className="mt-2 font-display text-xl font-bold text-slate-900">Community идэвхгүй байна</h1>
          <p className="mt-1.5 text-xs text-slate-600">
            Community нь сонголттой. Та хүсвэл хувийн AI зөвлөхөө дангаар нь ашиглах эсвэл нэгдэж болно.
          </p>
          <button
            type="button"
            onClick={() => updateConsent({ communityJoined: true })}
            className="mt-4 min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
          >
            Community-д нэгдэх
          </button>
        </section>
      </div>
    );
  }

  const handleToggleGroup = async (id: string) => {
    await fetch(`/api/community/groups/${id}/toggle`, { method: 'POST' });
    await onRefresh();
  };

  const handleOpenGroupChat = (group: WalkingGroup) => {
    setActiveChannelId(group.id);
    setSubTab('chat');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    await fetch('/api/community/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: selectedGroupId,
        title: eventTitle,
        meetingSpot: eventSpot,
        districtZone: 'Нийтийн уулзах цэг · Улаанбаатар',
        dateTimeLabel: eventTime,
      }),
    });
    setEventTitle('');
    setNotice('Хамт алхах арга хэмжээ үүслээ.');
    await onRefresh();
  };

  const handleRsvp = async (id: string) => {
    await fetch(`/api/community/events/${id}/rsvp`, { method: 'POST' });
    await onRefresh();
  };

  const handleToggleChallenge = async () => {
    await fetch('/api/community/challenge/toggle', { method: 'POST' });
    await onRefresh();
  };

  const handleNearbyConnect = async (id: string) => {
    const res = await fetch(`/api/community/nearby/${id}/connect`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error);
      return;
    }
    setNotice('Хүсэлт шинэчлэгдлээ. Хоёр тал зөвшөөрсөн үед чат нээгдэнэ.');
    await onRefresh();
  };

  const handleBlock = async (personId: string) => {
    await fetch('/api/community/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId }),
    });
    setNotice('Хэрэглэгч блоклогдлоо.');
    await onRefresh();
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId) return;
    await fetch('/api/community/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: reportTargetId, reason: reportReason }),
    });
    setReportTargetId(null);
    setNotice('Зөрчлийн мэдээлэл баталгаажлаа.');
    await onRefresh();
  };

  const handleSendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannelId || !chatInput.trim()) return;
    const res = await fetch('/api/community/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: activeChannelId,
        senderName: userName,
        text: chatInput.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || 'Зурвас илгээж чадсангүй.');
      return;
    }
    setChatInput('');
    await onRefresh();
  };

  const handleSubmitEventProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannelId || !proposalTitle.trim() || !proposalDate.trim() || !proposalTime.trim()) return;
    const formattedDateTime = `${proposalDate.trim()} · ${proposalTime.trim()}`;
    const res = await fetch('/api/community/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: activeChannelId,
        senderName: userName,
        text: 'Шинэ эвент үүсгэлээ',
        proposal: {
          title: proposalTitle.trim(),
          date: proposalDate.trim(),
          time: proposalTime.trim(),
          dateTimeLabel: formattedDateTime,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || 'Эвент оруулж чадсангүй.');
      return;
    }
    setProposalTitle('');
    setProposalDate(getDefaultEventDate());
    setProposalTime('09:00');
    setShowProposalModal(false);
    if (data.createdMessageId) {
      setSelectedEventMsgId(data.createdMessageId);
    }
    await onRefresh();
  };

  const handleChatEventRsvp = async (messageId: string, response: 'going' | 'not_going') => {
    await fetch(`/api/community/chat/${messageId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    });
    await onRefresh();
  };

  const channelMessages = messages.filter((m) => m.channelId === activeChannelId);
  const activeGroupObj = joinedGroups.find((g) => g.id === activeChannelId);
  const activeFriendObj = connectedPeople.find((p) => p.id === activeChannelId);

  return (
    <div className="space-y-4 p-4 pb-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-blue-700">Хоёр талын зөвшөөрөлтэй</p>
            <h1 className="font-display text-xl font-bold text-slate-900">Community ба Бүлэг</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateConsent({ profileHidden: !consent.profileHidden })}
              className={`flex min-h-[36px] items-center gap-1 rounded-xl border px-2.5 text-[11px] font-semibold ${
                consent.profileHidden ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-700'
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
              {consent.profileHidden ? 'Нуусан' : 'Нуух'}
            </button>
            <button
              type="button"
              onClick={() => updateConsent({ communityJoined: false })}
              className="min-h-[36px] rounded-xl border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600"
            >
              Гарах
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: 'groups', label: 'Бүлгүүд' },
            { id: 'nearby', label: 'Ойролцоох' },
            { id: 'chat', label: 'Чат' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as 'groups' | 'nearby' | 'chat')}
              className={`min-h-[38px] rounded-lg px-2 text-xs font-semibold ${
                subTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {notice && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            {notice}
          </div>
        )}
      </section>

      {subTab === 'groups' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-700">{challenge.endsInLabel}</p>
                  <h2 className="text-sm font-bold text-slate-900">{challenge.title}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleChallenge}
                className={`min-h-[36px] shrink-0 rounded-xl px-3 text-[11px] font-bold ${
                  challenge.joined ? 'border border-blue-200 bg-blue-50 text-blue-800' : 'bg-blue-600 text-white'
                }`}
              >
                {challenge.joined ? 'Нэгдсэн' : 'Нэгдэх'}
              </button>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${Math.min(100, Math.round((challenge.communitySteps / challenge.targetSteps) * 100))}%` }}
              />
            </div>
            <p className="tabular-nums mt-1 text-[11px] text-slate-600">
              {challenge.communitySteps.toLocaleString('en-US')} / {challenge.targetSteps.toLocaleString('en-US')} алхам · {challenge.participantsCount} оролцогч
            </p>
          </section>

          <section className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Алхалтын бүлгүүд</h2>
            {groups.map((grp) => (
              <div key={grp.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{grp.name}</p>
                    <p className="text-[11px] text-slate-600">{grp.goalFocus}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {grp.meetingSpot} · {grp.memberCount} гишүүн
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleGroup(grp.id)}
                    className={`min-h-[36px] shrink-0 rounded-xl px-3 text-[11px] font-bold ${
                      grp.joined ? 'border border-blue-200 bg-blue-50 text-blue-800' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {grp.joined ? 'Гарах' : 'Нэгдэх'}
                  </button>
                </div>

                {grp.joined && (
                  <button
                    type="button"
                    onClick={() => handleOpenGroupChat(grp)}
                    className="mt-2.5 flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                    Бүлгийн чат нээх
                  </button>
                )}
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Хамт алхах арга хэмжээ</h2>
            <form onSubmit={handleCreateEvent} className="space-y-2 rounded-xl bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="min-h-[38px] rounded-xl border border-slate-300 bg-white px-2 text-[11px]"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="min-h-[38px] rounded-xl border border-slate-300 bg-white px-2.5 text-[11px]"
                />
              </div>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Арга хэмжээний нэр"
                className="min-h-[38px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs"
              />
              <input
                type="text"
                value={eventSpot}
                onChange={(e) => setEventSpot(e.target.value)}
                placeholder="Нийтийн уулзах цэг"
                className="min-h-[38px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs"
              />
              <button
                type="submit"
                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Арга хэмжээ нийтлэх
              </button>
            </form>

            {events.map((evt) => (
              <div key={evt.id} className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    {evt.dateTimeLabel} · {evt.participants} оролцогч
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">{evt.title}</p>
                  <p className="text-[11px] text-slate-600">
                    {evt.groupName} · {evt.meetingSpot}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRsvp(evt.id)}
                  className={`min-h-[36px] shrink-0 rounded-xl px-3 text-[11px] font-bold ${
                    evt.joined ? 'border border-blue-200 bg-blue-50 text-blue-800' : 'border border-slate-300 text-slate-800'
                  }`}
                >
                  {evt.joined ? 'Оролцоно' : 'Нэгдэх'}
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {subTab === 'nearby' && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Ойролцоох хүмүүс</h2>
              <p className="text-[11px] text-slate-600">Зөвхөн дүүргийн бүс, нийтийн цэг харагдана</p>
            </div>
            <button
              type="button"
              onClick={() => updateConsent({ locationConsent: !consent.locationConsent })}
              className={`flex min-h-[38px] items-center gap-1 rounded-xl px-3 text-[11px] font-bold ${
                consent.locationConsent ? 'border border-blue-200 bg-blue-50 text-blue-800' : 'bg-blue-600 text-white'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {consent.locationConsent ? 'Цуцлах' : 'Зөвшөөрөх'}
            </button>
          </div>

          {!consent.locationConsent || consent.profileHidden ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-600">
              {consent.profileHidden
                ? 'Та профайлаа нуусан тул жагсаалт хаалттай байна.'
                : 'Бүсийн зөвшөөрлөө асаасны дараа хоёр тал зөвшөөрсөн хүмүүстэй холбогдоно.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {nearbyPeople.map((person) => (
                <div key={person.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{person.displayName}</p>
                    <span className="text-[11px] font-semibold text-blue-700">
                      {person.mutualConsent === 'connected'
                        ? 'Хоёр тал зөвшөөрсөн'
                        : person.mutualConsent === 'pending_incoming'
                        ? 'Хүсэлт ирсэн'
                        : person.mutualConsent === 'pending_outgoing'
                        ? 'Хүлээгдэж буй'
                        : 'Ижил бүс'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">{person.goalFocus}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {person.districtZone} · {person.suggestedPublicSpot}
                  </p>

                  <div className="mt-2.5 flex gap-2">
                    {person.mutualConsent === 'connected' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChannelId(person.id);
                          setSubTab('chat');
                        }}
                        className="flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 text-xs font-bold text-white"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Чатлах
                      </button>
                    ) : person.mutualConsent === 'pending_incoming' ? (
                      <button
                        type="button"
                        onClick={() => handleNearbyConnect(person.id)}
                        className="flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 text-xs font-bold text-white"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Зөвшөөрөх
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={person.mutualConsent === 'pending_outgoing'}
                        onClick={() => handleNearbyConnect(person.id)}
                        className="flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 disabled:opacity-60"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {person.mutualConsent === 'pending_outgoing' ? 'Илгээсэн' : 'Холбогдох'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleBlock(person.id)}
                      className="flex min-h-[38px] items-center justify-center rounded-xl border border-slate-200 px-2.5 text-slate-600"
                      title="Блоклох"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportTargetId(person.id)}
                      className="flex min-h-[38px] items-center justify-center rounded-xl border border-slate-200 px-2.5 text-slate-600"
                      title="Мэдээлэх"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reportTargetId && (
            <form onSubmit={handleReportSubmit} className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-950">Зөрчил мэдээлэх</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="min-h-[38px] w-full rounded-xl border border-amber-300 bg-white px-2 text-xs"
              >
                <option value="Зохисгүй харилцаа эсвэл спам">Зохисгүй харилцаа эсвэл спам</option>
                <option value="Хуурамч профайл">Хуурамч профайл</option>
                <option value="Аюулгүй байдлын зөрчил">Аюулгүй байдлын зөрчил</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="min-h-[36px] flex-1 rounded-xl bg-amber-600 text-xs font-bold text-white">
                  Илгээх
                </button>
                <button
                  type="button"
                  onClick={() => setReportTargetId(null)}
                  className="min-h-[36px] rounded-xl border border-slate-300 bg-white px-3 text-xs"
                >
                  Болих
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {subTab === 'chat' && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Joined Group & Connected Friends Switcher */}
          {joinedGroups.length === 0 && connectedPeople.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-600">
              <p>Чатад бичихийн тулд өөрийн хүссэн бүлэгт нэгдэнэ үү:</p>
              <div className="mt-3 space-y-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleToggleGroup(g.id)}
                    className="min-h-[40px] w-full rounded-xl bg-blue-600 px-3 text-xs font-bold text-white"
                  >
                    + {g.name} бүлэгт нэгдэх
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-3 py-2.5">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {joinedGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setActiveChannelId(g.id);
                        setSelectedEventMsgId(null);
                        setShowProposalModal(false);
                      }}
                      className={`min-h-[34px] shrink-0 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeChannelId === g.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                  {connectedPeople.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveChannelId(p.id);
                        setSelectedEventMsgId(null);
                        setShowProposalModal(false);
                      }}
                      className={`min-h-[34px] shrink-0 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeChannelId === p.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p.displayName}
                    </button>
                  ))}
                </div>

                {/* Active Messenger Thread Header */}
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {activeGroupObj ? activeGroupObj.name : activeFriendObj?.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {activeGroupObj
                        ? `${activeGroupObj.memberCount} гишүүн`
                        : activeFriendObj?.districtZone}
                    </p>
                  </div>
                  {(activeGroupObj || activeFriendObj) && (
                    <button
                      type="button"
                      onClick={() => setShowProposalModal((v) => !v)}
                      className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold transition-colors whitespace-nowrap ${
                        showProposalModal
                          ? 'bg-slate-800 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      {showProposalModal ? 'Хаах' : 'Эвент үүсгэх'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messenger Message Feed */}
              <div ref={chatFeedRef} className="max-h-80 space-y-3 overflow-y-auto bg-slate-50 p-3.5">
                {channelMessages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">
                    Энд одоогоор зурвас алга. Сайн уу гэж бичээд яриа эхлүүлээрэй!
                  </p>
                ) : (
                  channelMessages.map((m) => {
                    const proposal = m.eventProposal;
                    const isSelected = Boolean(proposal && selectedEventMsgId === m.id);

                    return (
                      <div key={m.id} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                        <span className="mb-0.5 px-1 text-[10px] text-slate-400">
                          {m.isMe ? 'Та' : m.senderName} · {m.sentAt}
                        </span>

                        {!proposal && (
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              m.isMe
                                ? 'rounded-br-sm bg-blue-600 text-white'
                                : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                            }`}
                          >
                            <p>{m.text}</p>
                          </div>
                        )}

                        {proposal && (
                          <div
                            className={`mt-1 w-[92%] overflow-hidden rounded-2xl border bg-white text-slate-900 transition-all ${
                              isSelected
                                ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedEventMsgId((prev) => (prev === m.id ? null : m.id))
                              }
                              aria-pressed={isSelected}
                              className={`w-full p-3 text-left transition-colors ${
                                isSelected ? 'bg-blue-50/60' : 'bg-white hover:bg-slate-50/70'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                    Хамтын эвент
                                  </p>
                                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                                    {proposal.title}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isSelected ? 'Сонгогдсон' : 'Сонгох'}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-600">
                                {proposal.date ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 tabular-nums">
                                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                                      {proposal.date}
                                    </span>
                                    {proposal.time && (
                                      <span className="inline-flex items-center gap-1 tabular-nums">
                                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                                        {proposal.time}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                                    {proposal.dateTimeLabel}
                                  </span>
                                )}
                              </div>

                              {isSelected && (
                                <div className="mt-2.5 rounded-xl border border-blue-200 bg-white px-2.5 py-2 text-[11px] text-slate-700">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>Зохион байгуулагч: {m.isMe ? 'Та' : m.senderName}</span>
                                    <span className="font-semibold text-blue-800">
                                      {proposal.myResponse === 'going'
                                        ? 'Та оролцоно'
                                        : proposal.myResponse === 'not_going'
                                        ? 'Та оролцохгүй'
                                        : 'Сонголт хийгээгүй'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </button>

                            <div className="flex gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => handleChatEventRsvp(m.id, 'going')}
                                aria-label="Оролцоно (Join)"
                                aria-pressed={proposal.myResponse === 'going'}
                                className={`tabular-nums flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-bold whitespace-nowrap transition-colors ${
                                  proposal.myResponse === 'going'
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-blue-200 bg-white text-blue-800 hover:bg-blue-50'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Оролцоно ({proposal.goingCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => handleChatEventRsvp(m.id, 'not_going')}
                                aria-label="Оролцохгүй (Decline)"
                                aria-pressed={proposal.myResponse === 'not_going'}
                                className={`tabular-nums flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-bold whitespace-nowrap transition-colors ${
                                  proposal.myResponse === 'not_going'
                                    ? 'bg-slate-800 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <X className="h-3.5 w-3.5" />
                                Оролцохгүй ({proposal.notGoingCount})
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create New Community Event Form */}
              {showProposalModal && (activeGroupObj || activeFriendObj) && (
                <form
                  onSubmit={handleSubmitEventProposal}
                  className="space-y-2.5 border-t border-blue-200 bg-blue-50/70 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-950">Шинэ эвент үүсгэх</p>
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Болих
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Эвентийн нэр
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      placeholder="Ж: Өглөөний 5 км хамтын алхалт"
                      className="min-h-[40px] w-full rounded-xl border border-blue-200 bg-white px-3 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        Огноо
                      </label>
                      <input
                        type="date"
                        required
                        value={proposalDate}
                        onChange={(e) => setProposalDate(e.target.value)}
                        className="min-h-[40px] w-full rounded-xl border border-blue-200 bg-white px-2.5 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        Цаг
                      </label>
                      <input
                        type="time"
                        required
                        value={proposalTime}
                        onChange={(e) => setProposalTime(e.target.value)}
                        className="min-h-[40px] w-full rounded-xl border border-blue-200 bg-white px-2.5 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 whitespace-nowrap"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Чатад эвент оруулах
                  </button>
                </form>
              )}

              {/* Messenger Bottom Text Input Bar */}
              <form
                onSubmit={handleSendTextMessage}
                className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5"
              >
                <button
                  type="button"
                  onClick={() => setShowProposalModal((v) => !v)}
                  aria-label="Шинэ эвент үүсгэх"
                  title="Эвент үүсгэх"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    showProposalModal
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <CalendarPlus className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Зурвас бичих..."
                  className="min-h-[40px] flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Илгээх"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
};
