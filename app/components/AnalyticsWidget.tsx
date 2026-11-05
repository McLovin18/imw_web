/**
 * 📊 ANALYTICS WIDGET
 * Beautiful analytics dashboard for admin page
 * Shows page views, clicks, and interactions
 */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { getTodayAnalytics, getWeeklyAnalytics, getAnalyticsByRange } from "../lib/analytics-db";

interface Analytics {
  uniqueVisitors: number;
  totalClicks: number;
  clicksByType?: {
    productClick: number;
    categoryClick: number;
    buttonClick: number;
    linkClick: number;
    blogClick: number;
    [key: string]: number;
  };
  purchases?: {
    whatsapp: number;
    transferencia: number;
    total: number;
  };
}

export default function AnalyticsWidget() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState<Analytics[]>([]);
  const [rangeAnalytics, setRangeAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      if (dateRange === 'today') {
        const todayData = await getTodayAnalytics();
        setAnalytics(todayData || {
          uniqueVisitors: 0,
          totalClicks: 0,
          clicksByType: {
            productClick: 0,
            categoryClick: 0,
            buttonClick: 0,
            linkClick: 0,
            blogClick: 0,
          },
          purchases: {
            whatsapp: 0,
            transferencia: 0,
            total: 0,
          },
        });
        setRangeAnalytics([]);
      } else if (dateRange === 'week') {
        const weeklyData = await getWeeklyAnalytics();
        setAnalytics(null);
        setRangeAnalytics(weeklyData);
      } else if (dateRange === 'custom' && startDate && endDate) {
        const rangeData = await getAnalyticsByRange(startDate, endDate);
        setAnalytics(null);
        setRangeAnalytics(rangeData);
      }

      // Always load weekly data for the weekly comparison section
      const weeklyData = await getWeeklyAnalytics();
      setWeeklyAnalytics(weeklyData);
      setError(null);
    } catch (err) {
      setError("Error cargando analytics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  // Effect to load analytics with debouncing for custom dates
  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // For today and week, load immediately
    if (dateRange === 'today' || dateRange === 'week') {
      loadAnalytics();
      return;
    }

    // For custom range, debounce to avoid loading on every keystroke
    if (dateRange === 'custom' && startDate && endDate) {
      debounceRef.current = setTimeout(() => {
        loadAnalytics();
      }, 500); // 500ms debounce
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [dateRange, startDate, endDate, loadAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 border border-purple-100 dark:border-slate-700 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center animate-pulse">
            <span className="material-icons-round text-purple-600 dark:text-purple-400">
              show_chart
            </span>
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
      </div>
    );
  }

  const clicks = analytics?.clicksByType || {
    productClick: 0,
    categoryClick: 0,
    buttonClick: 0,
    linkClick: 0,
    blogClick: 0,
  };

  const purchases = analytics?.purchases || {
    whatsapp: 0,
    transferencia: 0,
    total: 0,
  };

  // Calculate totals from rangeAnalytics when not viewing today
  const rangeTotalVisitors = rangeAnalytics.reduce((sum, day) => sum + (day.uniqueVisitors || 0), 0);
  const rangeTotalClicks = rangeAnalytics.reduce((sum, day) => sum + (day.totalClicks || 0), 0);
  const rangeTotalPurchases = rangeAnalytics.reduce((sum, day) => sum + (day.purchases?.total || 0), 0);
  const rangeTotalWhatsApp = rangeAnalytics.reduce((sum, day) => sum + (day.purchases?.whatsapp || 0), 0);
  const rangeTotalTransferencia = rangeAnalytics.reduce((sum, day) => sum + (day.purchases?.transferencia || 0), 0);

  // Use range totals or today's data
  const displayVisitors = dateRange === 'today' ? (analytics?.uniqueVisitors || 0) : rangeTotalVisitors;
  const displayClicks = dateRange === 'today' ? (analytics?.totalClicks || 0) : rangeTotalClicks;
  const displayPurchases = dateRange === 'today' ? purchases : {
    whatsapp: dateRange === 'today' ? purchases.whatsapp : rangeTotalWhatsApp,
    transferencia: dateRange === 'today' ? purchases.transferencia : rangeTotalTransferencia,
    total: dateRange === 'today' ? purchases.total : rangeTotalPurchases,
  };

  const engagementScore = Math.min(
    100,
    Math.round(
      displayClicks / Math.max(1, displayVisitors) * 100
    )
  );

  // Calculate weekly totals
  const weeklyTotal = weeklyAnalytics.reduce((sum, day) => sum + (day.purchases?.total || 0), 0);
  const weeklyWhatsApp = weeklyAnalytics.reduce((sum, day) => sum + (day.purchases?.whatsapp || 0), 0);
  const weeklyTransferencia = weeklyAnalytics.reduce((sum, day) => sum + (day.purchases?.transferencia || 0), 0);

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
          <span className="material-icons-round text-white">
            show_chart
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Análisis
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dateRange === 'today' ? 'Hoy' : dateRange === 'week' ? 'Últimos 7 días' : 'Rango personalizado'}
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setDateRange('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            dateRange === 'today'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setDateRange('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            dateRange === 'week'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          7 días
        </button>
        <button
          onClick={() => setDateRange('custom')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            dateRange === 'custom'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Personalizado
        </button>
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            />
            <span className="text-slate-500 dark:text-slate-400">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            />
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unique Visitors Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
                Visitantes
              </p>
              <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                {displayVisitors}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="material-icons-round text-2xl text-blue-600 dark:text-blue-300">
                people
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {dateRange === 'today' ? 'Personas que entraron hoy' : 'Personas que entraron en el rango'}
          </p>
        </div>

        {/* Total Clicks Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-1">
                Clicks
              </p>
              <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                {displayClicks}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="material-icons-round text-2xl text-purple-600 dark:text-purple-300">
                touch_app
              </span>
            </div>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {dateRange === 'today' ? 'Interacciones totales hoy' : 'Interacciones totales en el rango'}
          </p>
        </div>
      </div>

      {/* Engagement Score */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700/50 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-300 mb-1">
              Indicador de Engagement
            </p>
            <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {engagementScore}%
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">{engagementScore}%</span>
          </div>
        </div>
        <div className="w-full bg-amber-200 dark:bg-amber-700/30 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${engagementScore}%` }}
          ></div>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
          {engagementScore < 20
            ? "Bajo engagement - Considera revisar el contenido"
            : engagementScore < 50
              ? "Engagement moderado - Hay oportunidad de mejora"
              : engagementScore < 80
                ? "Buen engagement - ¡Los usuarios están interactuando!"
                : "Excelente engagement - ¡Los usuarios aman tu sitio!"}
        </p>
      </div>

      {/* Purchase Analytics - Daily */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <span className="material-icons-round text-green-600 dark:text-green-400">
            shopping_cart
          </span>
          Compras {dateRange === 'today' ? 'del Día' : dateRange === 'week' ? 'Últimos 7 días' : 'en el Rango'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700/50 text-center">
            <div className="flex justify-center mb-2 text-green-600 dark:text-green-300">
              <span className="material-icons-round text-2xl">chat</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
              {displayPurchases.whatsapp}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              WhatsApp
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700/50 text-center">
            <div className="flex justify-center mb-2 text-purple-600 dark:text-purple-300">
              <span className="material-icons-round text-2xl">account_balance</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {displayPurchases.transferencia}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Transferencia
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50 text-center">
            <div className="flex justify-center mb-2 text-blue-600 dark:text-blue-300">
              <span className="material-icons-round text-2xl">attach_money</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {displayPurchases.total}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Total
            </p>
          </div>
        </div>
      </div>

      {/* Purchase Analytics - Weekly */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <span className="material-icons-round text-blue-600 dark:text-blue-400">
            date_range
          </span>
          Compras Semanales (últimos 7 días)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700/50 text-center">
            <div className="flex justify-center mb-2 text-green-600 dark:text-green-300">
              <span className="material-icons-round text-2xl">chat</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
              {weeklyWhatsApp}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              WhatsApp
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700/50 text-center">
            <div className="flex justify-center mb-2 text-purple-600 dark:text-purple-300">
              <span className="material-icons-round text-2xl">account_balance</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {weeklyTransferencia}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Transferencia
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50 text-center">
            <div className="flex justify-center mb-2 text-blue-600 dark:text-blue-300">
              <span className="material-icons-round text-2xl">attach_money</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {weeklyTotal}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Total
            </p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown (only show when not today) */}
      {dateRange !== 'today' && rangeAnalytics.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <span className="material-icons-round text-purple-600 dark:text-purple-400">
              calendar_today
            </span>
            Visitas por Día
          </h3>

          <div className="space-y-3">
            {rangeAnalytics.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="material-icons-round text-purple-600 dark:text-purple-400 text-lg">
                      person
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(day.date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {day.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {day.uniqueVisitors || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    visitas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <span className="material-icons-round text-purple-600 dark:text-purple-400">
            gesture
          </span>
          Desglose de Interacciones
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { type: "productClick", label: "Productos", icon: "shopping_cart", color: "blue" },
            { type: "categoryClick", label: "Categorías", icon: "category", color: "green" },
            { type: "buttonClick", label: "Botones", icon: "smart_button", color: "orange" },
            { type: "blogClick", label: "Blogs", icon: "article", color: "indigo" },
            { type: "linkClick", label: "Enlaces", icon: "link", color: "pink" },
          ].map((item) => (
            <div
              key={item.type}
              className={`bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg p-4 border border-${item.color}-200 dark:border-${item.color}-700/50 text-center`}
            >
              <div
                className={`flex justify-center mb-2 text-${item.color}-600 dark:text-${item.color}-300`}
              >
                <span className="material-icons-round text-2xl">{item.icon}</span>
              </div>
              <p
                className={`text-2xl font-bold text-${item.color}-900 dark:text-${item.color}-100 mb-1`}
              >
                {clicks[item.type] || 0}
              </p>
              <p
                className={`text-xs text-${item.color}-600 dark:text-${item.color}-400`}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50 flex gap-3">
        <span className="material-icons-round text-blue-600 dark:text-blue-400 flex-shrink-0">
          info
        </span>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Los datos se reinician diariamente alrededor de las 11 PM. Esta sección se actualiza cada 30 segundos.
        </p>
      </div>
    </div>
  );
}

