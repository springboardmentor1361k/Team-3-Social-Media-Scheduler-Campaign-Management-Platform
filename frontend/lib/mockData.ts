// ─── Mock User ────────────────────────────────────────────────────────────────
export const mockUser = {
  id: "usr_01",
  fullName: "Alexandra Chen",
  email: "alex.chen@socialpilot.io",
  phone: "+1 (415) 555-0182",
  bio: "Head of Social Media Strategy at SocialPilot. Passionate about data-driven campaigns, brand storytelling, and growing communities across platforms.",
  role: "Admin",
  plan: "Pro",
  timezone: "America/New_York",
  joinedAt: "January 2024",
  avatarInitials: "AC",
  avatarColor: "#7c3aed",
};

// ─── Mock Stats ───────────────────────────────────────────────────────────────
export const mockStats = [
  {
    label: "Connected Accounts",
    value: "5",
    trend: "+1",
    trendLabel: "this month",
    positive: true,
    icon: "wifi",
    color: "violet",
  },
  {
    label: "Scheduled Posts",
    value: "11",
    trend: "+3",
    trendLabel: "since last week",
    positive: true,
    icon: "clock",
    color: "blue",
  },
  {
    label: "Analytics Score",
    value: "94.2",
    trend: "+5.4",
    trendLabel: "vs last month",
    positive: true,
    icon: "bar-chart",
    color: "emerald",
  },
  {
    label: "Notifications",
    value: "7",
    trend: "3 unread",
    trendLabel: "",
    positive: null,
    icon: "bell",
    color: "amber",
  },
];

// ─── Dashboard Extended Stats ─────────────────────────────────────────────────
export const mockDashboardStats = [
  { label: "Connected Accounts", value: "5",     trend: "+1",    positive: true,  icon: "wifi" },
  { label: "Scheduled Posts",    value: "11",    trend: "+3",    positive: true,  icon: "clock" },
  { label: "Published Posts",    value: "48",    trend: "+12",   positive: true,  icon: "check-circle" },
  { label: "Active Campaigns",   value: "3",     trend: "0",     positive: null,  icon: "megaphone" },
  { label: "Engagement Rate",    value: "5.8%",  trend: "+0.4%", positive: true,  icon: "activity" },
  { label: "Total Followers",    value: "61.1K", trend: "+2.4K", positive: true,  icon: "users" },
  { label: "Pending Posts",      value: "4",     trend: "-2",    positive: false, icon: "calendar" },
  { label: "Failed Posts",       value: "1",     trend: "-3",    positive: false, icon: "alert-circle" },
];

// ─── Connected Accounts ───────────────────────────────────────────────────────
export const mockConnectedAccounts = [
  { id: 1, platform: "Twitter / X",  handle: "@alexchen_media", followers: "12.4K", color: "#000000", icon: "twitter",    connected: true  },
  { id: 2, platform: "LinkedIn",     handle: "Alexandra Chen",  followers: "8.9K",  color: "#0077b5", icon: "linkedin",   connected: true  },
  { id: 3, platform: "Instagram",    handle: "@alex.creates",   followers: "31.2K", color: "#e4405f", icon: "instagram",  connected: true  },
  { id: 4, platform: "Facebook",     handle: "Alex Chen Page",  followers: "5.8K",  color: "#1877f2", icon: "facebook",   connected: true  },
  { id: 5, platform: "Pinterest",    handle: "@alexchen",       followers: "2.8K",  color: "#e60023", icon: "pinterest",  connected: false },
];

// ─── Scheduled Posts ─────────────────────────────────────────────────────────
export const mockScheduledPosts = [
  { id: 1, platform: "LinkedIn",  content: "Q2 performance report: 42% growth in engagement across all channels 📈", time: "10:00", date: "Today",    status: "scheduled" },
  { id: 2, platform: "Twitter",   content: "Product launch is HERE! Link in bio 🎉 #launch #product",                time: "12:00", date: "Today",    status: "scheduled" },
  { id: 3, platform: "Facebook",  content: "Join our webinar this Thursday at 3PM EST. Register now! →",            time: "14:00", date: "Today",    status: "scheduled" },
  { id: 4, platform: "Instagram", content: "Summer sale starts NOW — 30% off everything 🌊 Shop the link in bio",   time: "20:00", date: "Today",    status: "scheduled" },
  { id: 5, platform: "LinkedIn",  content: "We're hiring! Senior React Engineer — apply now. DM for details.",      time: "09:30", date: "Tomorrow", status: "draft"     },
  { id: 6, platform: "Twitter",   content: "5 tips for building a stronger brand on social media in 2025 🧵",       time: "11:00", date: "Tomorrow", status: "scheduled" },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const mockNotifications = [
  { id: 1, type: "success",  message: "Your LinkedIn post got 500+ reactions!",               time: "2 min ago",  read: false },
  { id: 2, type: "info",     message: "3 posts are scheduled for today.",                      time: "15 min ago", read: false },
  { id: 3, type: "warning",  message: "Instagram connection token expires in 2 days.",         time: "1 hr ago",   read: false },
  { id: 4, type: "success",  message: "Campaign 'Summer Drop' is now live.",                   time: "3 hrs ago",  read: true  },
  { id: 5, type: "error",    message: "Failed to publish post to Facebook. Retry?",            time: "5 hrs ago",  read: true  },
  { id: 6, type: "info",     message: "Weekly analytics report is ready.",                     time: "Yesterday",  read: true  },
  { id: 7, type: "success",  message: "New follower milestone: 60K on Instagram!",             time: "Yesterday",  read: true  },
];

// ─── Weekly Chart Data ────────────────────────────────────────────────────────
export const mockChartData = [
  { name: "Mon", likes: 400, comments: 240, shares: 200 },
  { name: "Tue", likes: 300, comments: 139, shares: 100 },
  { name: "Wed", likes: 550, comments: 380, shares: 250 },
  { name: "Thu", likes: 480, comments: 390, shares: 210 },
  { name: "Fri", likes: 700, comments: 480, shares: 300 },
  { name: "Sat", likes: 650, comments: 380, shares: 290 },
  { name: "Sun", likes: 500, comments: 430, shares: 200 },
];
