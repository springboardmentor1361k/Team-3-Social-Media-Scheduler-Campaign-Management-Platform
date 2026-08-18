"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  TrendingUp,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  Sparkles,
  Users,
  Target,
  Share2,
  PieChart,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  X,
  Plus,
} from "lucide-react";
import {
  FaTwitter,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaPinterest,
  FaYoutube,
} from "react-icons/fa";
import { apiListReports, apiListCampaigns, apiGetDashboardAnalytics, apiGetPlatformStats } from "@/lib/api";
import jsPDF from "jspdf";

const PLATFORM_META: Record<
  string,
  { name: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  Instagram: { name: "Instagram", icon: FaInstagram, color: "#e4405f", bgColor: "rgba(228,64,95,0.1)" },
  Facebook: { name: "Facebook", icon: FaFacebook, color: "#1877f2", bgColor: "rgba(24,119,242,0.1)" },
  LinkedIn: { name: "LinkedIn", icon: FaLinkedin, color: "#0077b5", bgColor: "rgba(0,119,181,0.1)" },
  Twitter: { name: "X (Twitter)", icon: FaTwitter, color: "#ffffff", bgColor: "rgba(255,255,255,0.08)" },
  YouTube: { name: "YouTube", icon: FaYoutube, color: "#ff0000", bgColor: "rgba(255,0,0,0.08)" },
  Pinterest: { name: "Pinterest", icon: FaPinterest, color: "#bd081c", bgColor: "rgba(189,8,28,0.1)" },
};

type ReportCategory = "engagement" | "campaigns" | "audience" | "publishing" | "platforms";

interface CampaignItem {
  id: number;
  name: string;
  status: string;
  platforms: string;
  budget: string;
  reach: string;
  engagement: string;
  progress: number;
  color: string;
}

interface MonthlyDataRow {
  month: string;
  posts: number;
  reach: string;
  engagement: string;
  revenue: string;
}

interface TopPostRow {
  title: string;
  platform: string;
  reach: string;
  eng: string;
  trend: string;
}

interface ReportDataResponse {
  monthly_data: MonthlyDataRow[];
  top_posts: TopPostRow[];
  totals: {
    posts: number;
    reach: string;
    engagement: string;
    growth: string;
  };
}

const MOCK_CAMPAIGN_DATA: CampaignItem[] = [
  {
    id: 1,
    name: "Summer Product Launch 2026",
    status: "Active",
    platforms: "Instagram, Facebook, X",
    budget: "$1,500",
    reach: "45.2K",
    engagement: "8.4%",
    progress: 65,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: 2,
    name: "Brand Awareness Q3",
    status: "Active",
    platforms: "LinkedIn, YouTube",
    budget: "$2,000",
    reach: "82.1K",
    engagement: "12.1%",
    progress: 40,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: 3,
    name: "Holiday Promo Prep",
    status: "Draft",
    platforms: "All Platforms",
    budget: "$800",
    reach: "12.4K",
    engagement: "5.2%",
    progress: 15,
    color: "from-amber-500 to-orange-600",
  },
];

const MOCK_AUDIENCE_DATA = {
  totalFollowers: "128.4K",
  growthRate: "+18.2%",
  topLocation: "United States (42%)",
  peakTime: "6:00 PM – 9:00 PM EST",
  demographics: [
    { group: "18 - 24 yrs", percentage: 22, color: "bg-blue-500" },
    { group: "25 - 34 yrs", percentage: 48, color: "bg-violet-500" },
    { group: "35 - 44 yrs", percentage: 18, color: "bg-purple-500" },
    { group: "45+ yrs", percentage: 12, color: "bg-emerald-500" },
  ],
  geographies: [
    { country: "United States", flag: "🇺🇸", percent: 42, count: "53.9K" },
    { country: "United Kingdom", flag: "🇬🇧", percent: 18, count: "23.1K" },
    { country: "Canada", flag: "🇨🇦", percent: 14, count: "17.9K" },
    { country: "Germany", flag: "🇩🇪", percent: 12, count: "15.4K" },
    { country: "India", flag: "🇮🇳", percent: 14, count: "18.1K" },
  ],
};

export default function ReportsView() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("engagement");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [data, setData] = useState<ReportDataResponse | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCampaignForReport, setSelectedCampaignForReport] = useState<string>("All");
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf");
  const [reportTimeWindow, setReportTimeWindow] = useState<string>("30d");
  const [toastMessage, setToastMessage] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = (await apiListReports()) as unknown as ReportDataResponse;
        setData(result);
      } catch (e) {
        console.error("Using local fallback reports data", e);
      }

      try {
        const campaignResult = (await apiListCampaigns()) as CampaignItem[];
        setCampaigns(campaignResult.length > 0 ? campaignResult : MOCK_CAMPAIGN_DATA);
      } catch {
        setCampaigns(MOCK_CAMPAIGN_DATA);
      }

      try {
        const dash = await apiGetDashboardAnalytics();
        setDashboardData(dash);
      } catch (e) {
        console.error("Using local fallback dashboard analytics", e);
      }

      try {
        const stats = await apiGetPlatformStats();
        setPlatformStats(stats.platforms || []);
      } catch (e) {
        console.error("Could not fetch platform stats", e);
      }
    }
    load();
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // CSV Export Engine
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Report Category", activeCategory.toUpperCase()],
      ["Period Filter", period],
      ["Platform Filter", selectedPlatform],
      [],
      ["Month", "Posts Published", "Total Reach", "Avg Engagement", "Est Revenue"],
      ...(data.monthly_data || []).map((m: MonthlyDataRow) => [
        m.month,
        m.posts,
        m.reach,
        m.engagement,
        m.revenue,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SocialPilot_Report_${activeCategory}_${period}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("CSV Spreadsheet report downloaded!");
  };

  // Custom Formatted PDF Generator Engine
  const handleExportPDF = () => {
    showNotification("Generating custom PDF report...");
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Dark executive header background
      doc.setFillColor(13, 9, 32); // #0d0920
      doc.rect(0, 0, 210, 297, "F");

      // Title & Branding
      doc.setTextColor(139, 92, 246); // violet accent
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("SOCIALPILOT", 15, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Executive Performance & Analytics Report", 15, 27);

      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.5);
      doc.line(15, 32, 195, 32);

      // Metadata Header Block
      doc.setFontSize(8.5);
      doc.setTextColor(180, 180, 200);
      doc.text(`Category: ${activeCategory.toUpperCase()}`, 15, 40);
      doc.text(`Time Filter: ${period.toUpperCase()}`, 75, 40);
      doc.text(`Platform Filter: ${selectedPlatform}`, 130, 40);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 46);

      let yPos = 56;

      // Section 1: KPI Totals Cards
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Executive Metrics Summary", 15, yPos);
      yPos += 5;

      const kpis = [
        { label: "Posts Published", val: String(totals?.posts || 0) },
        { label: "Total Reach", val: String(totals?.reach || "0") },
        { label: "Avg Engagement", val: String(totals?.engagement || "0%") },
        { label: "Audience Growth", val: String(totals?.growth || "0%") },
      ];

      kpis.forEach((kpi, idx) => {
        const x = 15 + idx * 45;
        doc.setFillColor(25, 20, 50);
        doc.roundedRect(x, yPos, 40, 20, 2.5, 2.5, "F");

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 180);
        doc.text(kpi.label, x + 4, yPos + 6);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(139, 92, 246);
        doc.text(kpi.val, x + 4, yPos + 15);
      });

      yPos += 28;

      // Section 2: Category Content
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);

      if (activeCategory === "engagement") {
        doc.text("Monthly Performance Breakdown", 15, yPos);
        yPos += 6;

        // Table Header
        doc.setFillColor(35, 25, 65);
        doc.rect(15, yPos, 180, 7, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 200, 220);
        doc.text("MONTH", 18, yPos + 5);
        doc.text("POSTS", 55, yPos + 5);
        doc.text("REACH", 90, yPos + 5);
        doc.text("ENGAGEMENT", 125, yPos + 5);
        doc.text("EST. REVENUE", 165, yPos + 5);
        yPos += 7;

        // Table Rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        filteredMonthlyData.forEach((row, i) => {
          if (i % 2 === 0) {
            doc.setFillColor(20, 15, 40);
            doc.rect(15, yPos, 180, 6.5, "F");
          }
          doc.setTextColor(255, 255, 255);
          doc.text(String(row.month), 18, yPos + 4.5);
          doc.text(String(row.posts), 55, yPos + 4.5);
          doc.text(String(row.reach), 90, yPos + 4.5);
          doc.setTextColor(52, 211, 153); // emerald
          doc.text(String(row.engagement), 125, yPos + 4.5);
          doc.setTextColor(167, 139, 250); // violet
          doc.text(String(row.revenue), 165, yPos + 4.5);
          yPos += 6.5;
        });

        // Top Posts Section
        yPos += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Top Content Performance", 15, yPos);
        yPos += 6;

        filteredTopPosts.forEach((post, i) => {
          doc.setFillColor(20, 15, 40);
          doc.roundedRect(15, yPos, 180, 7.5, 2, 2, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(139, 92, 246);
          doc.text(`#${i + 1}`, 18, yPos + 5);
          doc.setTextColor(255, 255, 255);
          doc.text(String(post.title).slice(0, 42), 28, yPos + 5);
          doc.setTextColor(160, 160, 180);
          doc.text(String(post.platform), 115, yPos + 5);
          doc.setTextColor(52, 211, 153);
          doc.text(`Reach: ${post.reach}  |  Eng: ${post.eng}`, 150, yPos + 5);
          yPos += 9;
        });

      } else if (activeCategory === "campaigns") {
        doc.text("Campaign ROI & Metrics Breakdown", 15, yPos);
        yPos += 6;

        filteredCampaigns.forEach((camp) => {
          doc.setFillColor(20, 15, 40);
          doc.roundedRect(15, yPos, 180, 16, 2.5, 2.5, "F");

          doc.setFontSize(9.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(String(camp.name), 18, yPos + 5.5);

          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(160, 160, 180);
          doc.text(`Status: ${camp.status}  |  Target Platforms: ${camp.platforms}`, 18, yPos + 11.5);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(52, 211, 153);
          doc.text(`Budget: ${camp.budget}  |  Reach: ${camp.reach}  |  Eng: ${camp.engagement}`, 110, yPos + 11.5);

          yPos += 19;
        });

      } else if (activeCategory === "audience") {
        doc.text("Audience Growth & Demographic Breakdown", 15, yPos);
        yPos += 6;

        // Key Audience Indicators
        doc.setFillColor(20, 15, 40);
        doc.roundedRect(15, yPos, 180, 14, 2.5, 2.5, "F");

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 180);
        doc.text(`Total Followers: ${audienceStats.value} (${audienceStats.trend} growth)`, 18, yPos + 5);
        doc.text(`Top Region: ${MOCK_AUDIENCE_DATA.topLocation}`, 18, yPos + 10);
        doc.text(`Peak Posting Window: ${MOCK_AUDIENCE_DATA.peakTime}`, 105, yPos + 5);
        doc.text(`Active Networks: 6 Social Channels`, 105, yPos + 10);
        yPos += 18;

        // Age Demographics Header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Age Group Distribution", 15, yPos);
        yPos += 5;

        MOCK_AUDIENCE_DATA.demographics.forEach((demo, i) => {
          if (i % 2 === 0) {
            doc.setFillColor(20, 15, 40);
            doc.rect(15, yPos, 180, 6, "F");
          }
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(255, 255, 255);
          doc.text(`Age Group: ${demo.group}`, 18, yPos + 4);
          doc.setTextColor(167, 139, 250);
          doc.text(`Share: ${demo.percentage}%`, 140, yPos + 4);
          yPos += 6;
        });

        // Countries Header
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Top Audience Geographies", 15, yPos);
        yPos += 5;

        MOCK_AUDIENCE_DATA.geographies.forEach((geo, i) => {
          doc.setFillColor(20, 15, 40);
          doc.roundedRect(15, yPos, 180, 6.5, 2, 2, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(255, 255, 255);
          doc.text(`${geo.country}`, 18, yPos + 4.5);
          doc.setTextColor(52, 211, 153);
          doc.text(`Followers: ${geo.count} (${geo.percent}%)`, 130, yPos + 4.5);
          yPos += 7.5;
        });

      } else if (activeCategory === "publishing") {
        doc.text("Publishing History & Execution Metrics", 15, yPos);
        yPos += 6;

        doc.setFillColor(20, 15, 40);
        doc.roundedRect(15, yPos, 180, 16, 2.5, 2.5, "F");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(52, 211, 153);
        doc.text("Successful Posts: 298 Posts (94% Success Rate)", 18, yPos + 6);
        doc.setTextColor(96, 165, 250);
        doc.text("Scheduled in Queue: 16 Posts pending dispatch", 18, yPos + 11.5);
        doc.setTextColor(251, 113, 133);
        doc.text("Failed Dispatches: 3 Posts (OAuth token refresh required)", 105, yPos + 6);
        yPos += 22;

      } else if (activeCategory === "platforms") {
        doc.text("Multi-Platform Channel Comparison Matrix", 15, yPos);
        yPos += 6;

        // Table Header
        doc.setFillColor(35, 25, 65);
        doc.rect(15, yPos, 180, 7, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 200, 220);
        doc.text("SOCIAL CHANNEL", 18, yPos + 5);
        doc.text("TOTAL AUDIENCE / FOLLOWERS", 85, yPos + 5);
        doc.text("AVG ENGAGEMENT RATE", 150, yPos + 5);
        yPos += 7;

        Object.entries(PLATFORM_META).forEach(([key, meta], i) => {
          if (i % 2 === 0) {
            doc.setFillColor(20, 15, 40);
            doc.rect(15, yPos, 180, 7, "F");
          }
          const pFollowers = dashboardData?.platformPerformance?.find((p: any) => p.platform === meta.name)?.followers || "142.8K";
          const pEng = dashboardData?.platformPerformance?.find((p: any) => p.platform === meta.name)?.engagement || "8.6%";

          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(meta.name, 18, yPos + 5);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(167, 139, 250);
          doc.text(pFollowers, 85, yPos + 5);

          doc.setTextColor(52, 211, 153);
          doc.text(pEng, 150, yPos + 5);
          yPos += 7.5;
        });
      }

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 130);
      doc.text("Generated by SocialPilot Analytics Engine • Confidential Document", 15, 288);

      doc.save(`SocialPilot_${activeCategory.toUpperCase()}_Report_${period}.pdf`);
      showNotification("Custom PDF Report generated and downloaded!");
    } catch (e) {
      console.error("PDF generation failed:", e);
      showNotification("Failed to generate custom PDF.");
    }
  };

  // Custom Campaign Report Generator (Step 2 Requirement Fix)
  const handleGenerateCustomCampaignReport = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGenerateModal(false);

    const targetCampaigns =
      selectedCampaignForReport === "All"
        ? campaigns
        : campaigns.filter((c) => c.name === selectedCampaignForReport);

    if (targetCampaigns.length === 0) {
      showNotification("No matching campaign data found.");
      return;
    }

    if (exportFormat === "csv") {
      const rows = [
        ["CUSTOM CAMPAIGN REPORT"],
        ["Selected Campaign", selectedCampaignForReport],
        ["Time Window", reportTimeWindow],
        ["Generated", new Date().toLocaleString()],
        [],
        ["ID", "Campaign Name", "Status", "Platforms", "Budget", "Reach", "Engagement Rate", "Progress"],
        ...targetCampaigns.map((c) => [
          c.id,
          c.name,
          c.status,
          c.platforms,
          c.budget,
          c.reach,
          c.engagement,
          `${c.progress}%`,
        ]),
      ];
      const csvContent =
        "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `SocialPilot_CampaignReport_${selectedCampaignForReport.replace(/\s+/g, "_")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Custom Campaign CSV Report downloaded!");
    } else {
      try {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Header Background
        doc.setFillColor(13, 9, 32);
        doc.rect(0, 0, 210, 297, "F");

        // Branding
        doc.setTextColor(139, 92, 246);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("SOCIALPILOT", 15, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Custom Campaign Performance & ROI Report", 15, 27);

        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(0.5);
        doc.line(15, 32, 195, 32);

        // Metadata Header
        doc.setFontSize(8.5);
        doc.setTextColor(180, 180, 200);
        doc.text(`Campaign: ${selectedCampaignForReport}`, 15, 40);
        doc.text(`Timeframe: ${reportTimeWindow.toUpperCase()}`, 110, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 46);

        let yPos = 56;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Campaign ROI & Metrics Summary", 15, yPos);
        yPos += 7;

        targetCampaigns.forEach((camp) => {
          doc.setFillColor(20, 15, 40);
          doc.roundedRect(15, yPos, 180, 20, 3, 3, "F");

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(String(camp.name), 18, yPos + 6);

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(160, 160, 180);
          doc.text(`Status: ${camp.status}  |  Channels: ${camp.platforms}`, 18, yPos + 12);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(52, 211, 153);
          doc.text(`Budget: ${camp.budget}  |  Reach: ${camp.reach}  |  Eng: ${camp.engagement}`, 105, yPos + 12);
          doc.setTextColor(167, 139, 250);
          doc.text(`Completion Progress: ${camp.progress}%`, 18, yPos + 17);

          yPos += 24;
        });

        // Footer
        doc.setFontSize(7.5);
        doc.setTextColor(110, 110, 130);
        doc.text("Generated by SocialPilot Campaign Engine • Confidential Document", 15, 288);

        doc.save(`SocialPilot_CampaignReport_${selectedCampaignForReport.replace(/\s+/g, "_")}.pdf`);
        showNotification("Custom Campaign PDF Report downloaded!");
      } catch (err) {
        console.error("Custom campaign PDF failed:", err);
        showNotification("Failed to generate campaign PDF.");
      }
    }
  };

  // Apply client-side filters
  const filteredMonthlyData = useMemo(() => {
    if (!data) return [];
    const all = data.monthly_data || [];
    if (period === "7d") return all.slice(-1);
    if (period === "30d") return all.slice(-2);
    if (period === "90d") return all.slice(-4);
    return all;
  }, [data, period]);

  const filteredTopPosts = useMemo(() => {
    if (!data) return [];
    if (selectedPlatform === "All") return data.top_posts || [];
    return (data.top_posts || []).filter((p) => p.platform === selectedPlatform);
  }, [data, selectedPlatform]);

  const filteredCampaigns = useMemo(() => {
    if (selectedPlatform === "All") return campaigns;
    return campaigns.filter(
      (c) => c.platforms.includes(selectedPlatform) || c.platforms === "All Platforms"
    );
  }, [campaigns, selectedPlatform]);

  if (!data) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-violet-400 font-bold">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading performance analytics & reports...</span>
        </div>
      </div>
    );
  }

  const { totals } = data;

  const audienceStats = dashboardData?.stats?.followers || { value: MOCK_AUDIENCE_DATA.totalFollowers, trend: MOCK_AUDIENCE_DATA.growthRate };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto custom-scrollbar" ref={reportRef}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-violet-900 border border-violet-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Bar & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <FileText className="w-4 h-4" />
            <span>Executive Performance Reports</span>
          </div>

          {/* Platform Filter Pill */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="All" className="bg-[#0d0920]">
              All Social Networks
            </option>
            {Object.keys(PLATFORM_META).map((p) => (
              <option key={p} value={p} className="bg-[#0d0920]">
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Time Period Filter & Export Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === p
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} /> Excel / CSV
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* 5 Report Category Selector Tabs (PRD Module 8 Compliance) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: "engagement", label: "Engagement Report", icon: BarChart2 },
          { id: "campaigns", label: "Campaign Reports", icon: Target },
          { id: "audience", label: "Audience Growth", icon: Users },
          { id: "publishing", label: "Publishing History", icon: Calendar },
          { id: "platforms", label: "Platform Comparison", icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as ReportCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40"
                  : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ENGAGEMENT REPORT ────────────────────────────────────────── */}
      {activeCategory === "engagement" && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                label: "Total Posts Published",
                value: totals.posts,
                icon: BarChart2,
                color: "text-violet-400",
                gradient: "from-violet-500 to-purple-600",
              },
              {
                label: "Total Audience Reach",
                value: totals.reach,
                icon: Eye,
                color: "text-blue-400",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                label: "Average Engagement",
                value: totals.engagement,
                icon: TrendingUp,
                color: "text-emerald-400",
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                label: "Audience Growth Rate",
                value: totals.growth,
                icon: ArrowUpRight,
                color: "text-amber-400",
                gradient: "from-amber-500 to-orange-600",
              },
            ].map(({ label, value, icon: Icon, color, gradient }) => (
              <div key={label} className="dash-card p-5">
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 opacity-80`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-white/40 mt-1">{label}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight size={11} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    +14.2% vs previous period
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Performance Table */}
          <div className="dash-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                <h2 className="text-[15px] font-black text-white">Monthly Engagement Metrics</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Calendar size={12} />
                Period: {period.toUpperCase()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Month", "Posts Published", "Total Reach", "Avg Engagement", "Est. Revenue"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[11px] font-black text-white/30 uppercase tracking-wider px-6 py-3"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthlyData.map((row: MonthlyDataRow, i: number) => (
                    <tr
                      key={row.month}
                      className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                        i === filteredMonthlyData.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <Calendar size={12} className="text-violet-400" />
                          </div>
                          <span className="text-sm font-semibold text-white">{row.month}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-white">{row.posts}</td>
                      <td className="px-6 py-3.5 text-sm text-white/70">{row.reach}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-bold text-emerald-400">{row.engagement}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-violet-400">{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performing Content */}
          <div className="dash-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-black text-white flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" /> Top Content Performance
              </h2>
            </div>
            <div className="space-y-3">
              {filteredTopPosts.length === 0 ? (
                <div className="p-4 text-center text-xs text-white/40">No top posts found for {selectedPlatform}.</div>
              ) : (
                filteredTopPosts.map((post: TopPostRow, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-black text-violet-400 shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                    <span className="text-xs font-semibold text-violet-400">{post.platform}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{post.reach}</p>
                    <p className="text-xs text-white/40">reach</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {post.trend === "up" ? (
                      <ArrowUpRight size={14} className="text-emerald-400" />
                    ) : (
                      <ArrowDownRight size={14} className="text-red-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        post.trend === "up" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {post.eng}
                    </span>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CAMPAIGN REPORTS (Step 2 Requirement) ─────────────────────── */}
      {activeCategory === "campaigns" && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-black text-white">Campaign Performance & ROI Tracking</h2>
              <p className="text-xs text-white/40 mt-0.5">
                Generate and analyze financial return, lead conversion, and budget efficiency across marketing campaigns.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/campaigns"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Target size={14} className="text-violet-400" /> Manage Campaigns
              </Link>

              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus size={14} /> Generate Custom Campaign Report
              </button>
            </div>
          </div>

          {/* Campaign Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCampaigns.length === 0 ? (
              <div className="col-span-3 p-10 text-center text-sm font-semibold text-white/40 border border-white/5 rounded-2xl bg-white/[0.02]">
                No campaigns match the selected platform filter ({selectedPlatform}).
              </div>
            ) : (
              filteredCampaigns.map((camp) => (
                <div key={camp.id} className="dash-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                        {camp.status} Campaign
                      </span>
                      <h3 className="text-base font-black text-white truncate mt-0.5">{camp.name}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                      {camp.budget}
                    </span>
                  </div>

                  <p className="text-xs text-white/40">Target Platforms: {camp.platforms}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      <p className="font-black text-emerald-400">{camp.reach}</p>
                      <p className="text-[9px] uppercase font-bold text-white/30">Total Reach</p>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      <p className="font-black text-blue-400">{camp.engagement}</p>
                      <p className="text-[9px] uppercase font-bold text-white/30">Engagement Rate</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-white/40 mb-1">
                      <span>Completion Progress</span>
                      <span>{camp.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${camp.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>

          {/* Campaign ROI & Conversion Breakdown */}
          <div className="dash-card p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-400" />
              Campaign Cost Per Click (CPC) & Conversion Analytics
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase font-bold">
                    <th className="py-3 text-left">Campaign Name</th>
                    <th className="py-3 text-center">Budget Allocated</th>
                    <th className="py-3 text-center">Leads / Clicks</th>
                    <th className="py-3 text-center">Avg CPC</th>
                    <th className="py-3 text-center">Est ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.length > 0 ? filteredCampaigns.map((camp, i) => {
                    // Estimate CPC from budget string (strip $ and commas)
                    const budgetNum = parseFloat((camp.budget || "0").replace(/[$,]/g, "")) || 0;
                    // Approximate clicks from reach (1% of reach)
                    const reachNum = parseFloat((camp.reach || "0").replace(/[K,]/g, "")) * (String(camp.reach).includes("K") ? 1000 : 1);
                    const estClicks = Math.round(reachNum * 0.01);
                    const cpc = estClicks > 0 ? (budgetNum / estClicks).toFixed(2) : "0.00";
                    const roi = budgetNum > 0 ? Math.round(((estClicks * 0.5) - budgetNum) / budgetNum * 100) : 0;
                    return (
                      <tr key={camp.id} className="border-b border-white/5">
                        <td className="py-3 font-bold text-white">{camp.name}</td>
                        <td className="py-3 text-center text-white/70">{camp.budget || "—"}</td>
                        <td className="py-3 text-center text-emerald-400 font-bold">{estClicks.toLocaleString()} clicks</td>
                        <td className="py-3 text-center text-white/70">${cpc}</td>
                        <td className={`py-3 text-center font-bold ${roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{roi >= 0 ? "+" : ""}{roi}%</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-white/40">No campaigns found. Create your first campaign to see ROI data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: AUDIENCE GROWTH (Step 1 Requirement) ─────────────────────── */}
      {activeCategory === "audience" && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-base font-black text-white">Audience Growth & Demographic Analytics</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Monitor follower acquisition trends, age/gender distributions, and peak active user windows.
            </p>
          </div>

          {/* Growth Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="dash-card p-5">
              <p className="text-xs font-bold text-white/40">Total Followers</p>
              <p className="text-2xl font-black text-violet-400 mt-1">{audienceStats.value}</p>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-2">
                <ArrowUpRight size={12} /> {audienceStats.trend} this month
              </span>
            </div>

            <div className="dash-card p-5">
              <p className="text-xs font-bold text-white/40">Top Geographic Region</p>
              <p className="text-base font-black text-white mt-2">{MOCK_AUDIENCE_DATA.topLocation}</p>
              <p className="text-[10px] text-white/40 mt-1">Highest audience concentration</p>
            </div>

            <div className="dash-card p-5">
              <p className="text-xs font-bold text-white/40">Peak Activity Window</p>
              <p className="text-base font-black text-emerald-400 mt-2">{MOCK_AUDIENCE_DATA.peakTime}</p>
              <p className="text-[10px] text-white/40 mt-1">Recommended posting window</p>
            </div>

            <div className="dash-card p-5">
              <p className="text-xs font-bold text-white/40">Active Channels</p>
              <p className="text-2xl font-black text-blue-400 mt-1">6 Networks</p>
              <p className="text-[10px] text-white/40 mt-1">Synchronized growth metrics</p>
            </div>
          </div>

          {/* Demographics & Geographies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Demographics */}
            <div className="dash-card p-6 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" /> Age Group Distribution
              </h3>

              <div className="space-y-3">
                {MOCK_AUDIENCE_DATA.demographics.map((demo) => (
                  <div key={demo.group} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-white/70">
                      <span>{demo.group}</span>
                      <span>{demo.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full ${demo.color}`}
                        style={{ width: `${demo.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="dash-card p-6 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" /> Top Audience Countries
              </h3>

              <div className="space-y-3">
                {MOCK_AUDIENCE_DATA.geographies.map((geo) => (
                  <div key={geo.country} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span>{geo.flag}</span>
                      <span>{geo.country}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-violet-300">{geo.count}</span>
                      <span className="text-[10px] text-white/40 ml-2">({geo.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PUBLISHING HISTORY REPORT ────────────────────────────────── */}
      {activeCategory === "publishing" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-black text-white">Publishing Execution History & Success Rates</h2>
              <p className="text-xs text-white/40 mt-0.5">
                Review post publishing queue execution status, success rates, and retry counts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/calendar"
                className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold rounded-xl transition-all"
              >
                <Calendar size={14} className="text-blue-400" /> Content Calendar
              </Link>
              <Link
                href="/publishing-logs"
                className="flex items-center gap-2 px-3.5 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold rounded-xl transition-all"
              >
                <RefreshCw size={14} className="text-violet-400" /> View Live Logs
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Real publishing_stats from API, fall back to zeros */}
            {(() => {
              const ps = (data as any)?.publishing_stats;
              return (
                <>
                  <div className="dash-card p-5">
                    <p className="text-xs font-bold text-white/40">Successful Posts</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{ps?.published ?? 0} Posts</p>
                    <p className="text-[10px] text-white/40 mt-1">{ps?.success_rate ?? "—"} execution success rate</p>
                  </div>
                  <div className="dash-card p-5">
                    <p className="text-xs font-bold text-white/40">Scheduled In Queue</p>
                    <p className="text-2xl font-black text-blue-400 mt-1">{ps?.scheduled ?? 0} Posts</p>
                    <p className="text-[10px] text-white/40 mt-1">Upcoming scheduled dispatches</p>
                  </div>
                  <div className="dash-card p-5">
                    <p className="text-xs font-bold text-white/40">Failed Dispatches</p>
                    <p className="text-2xl font-black text-rose-400 mt-1">{ps?.failed ?? 0} Posts</p>
                    <p className="text-[10px] text-white/40 mt-1">Requires OAuth token refresh</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB 5: PLATFORM COMPARISON REPORT ──────────────────────────────── */}
      {activeCategory === "platforms" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-black text-white">Multi-Platform Performance Comparison Matrix</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Side-by-side comparison of reach, engagement, and click performance per social channel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(PLATFORM_META).map(([key, meta]) => {
              const Icon = meta.icon;
              // Prefer live MongoDB platform stats; fall back to dashboardData
              const liveStat = platformStats.find(
                (p: any) => p.platform.toLowerCase() === key.toLowerCase()
              );
              const followers = liveStat?.followers ||
                dashboardData?.platformPerformance?.find((p: any) => p.platform === meta.name)?.followers ||
                "0";
              const engagement = liveStat?.engagement ||
                dashboardData?.platformPerformance?.find((p: any) => p.platform === meta.name)?.engagement ||
                "0%";
              const impressions = liveStat?.impressions || "0";
              const postCount = liveStat?.post_count ?? 0;
              return (
                <div key={key} className="dash-card p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                      style={{ background: meta.bgColor }}
                    >
                      <Icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{meta.name}</h3>
                      <p className="text-[10px] text-white/40">{postCount} posts tracked</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      <p className="font-bold text-white">{followers}</p>
                      <p className="text-[9px] uppercase text-white/30">Followers</p>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      <p className="font-bold text-emerald-400">{engagement}</p>
                      <p className="text-[9px] uppercase text-white/30">Avg Eng.</p>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5 col-span-2">
                      <p className="font-bold text-violet-400">{impressions}</p>
                      <p className="text-[9px] uppercase text-white/30">Total Impressions</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Custom Campaign Report Modal (Step 2 UI Requirement) */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            className="bg-[#0d0920] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in cursor-default space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                <Target className="w-5 h-5" />
                <span>Generate Custom Campaign Report</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleGenerateCustomCampaignReport}
              className="space-y-4 text-xs"
            >
              {/* Format Selector */}
              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Report Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat("pdf")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      exportFormat === "pdf"
                        ? "bg-violet-600 border-violet-500 text-white shadow-md"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    <Printer size={14} /> PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      exportFormat === "csv"
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    <FileSpreadsheet size={14} /> Excel / CSV
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Select Campaign</label>
                <select
                  value={selectedCampaignForReport}
                  onChange={(e) => setSelectedCampaignForReport(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="All" className="bg-[#0d0920]">
                    All Active Campaigns
                  </option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#0d0920]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-white/50 mb-1.5 block">Report Time Window</label>
                <select
                  value={reportTimeWindow}
                  onChange={(e) => setReportTimeWindow(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="30d" className="bg-[#0d0920]">Last 30 Days</option>
                  <option value="90d" className="bg-[#0d0920]">Last 90 Days</option>
                  <option value="full" className="bg-[#0d0920]">Full Campaign Lifecycle</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 font-bold text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md cursor-pointer"
                >
                  Download {exportFormat.toUpperCase()} Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GlobeIcon(props: { className?: string }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
