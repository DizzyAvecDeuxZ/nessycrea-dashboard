'use client'

import {
  MessageSquare,
  AlertCircle,
  Euro,
  TrendingUp,
  Star
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AreaChart, BarChart, DonutChart } from '@tremor/react'
import { formatCurrency } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  useDashboardStats,
  useRevenueData,
  useTopProducts,
  useOrderStatus,
  useRecentActivity
} from '@/hooks/useDashboard'
import type { Activity } from '@/lib/supabase'

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: revenueData = [], isLoading: revenueLoading } = useRevenueData()
  const { data: productData = [], isLoading: productsLoading } = useTopProducts()
  const { data: orderStatusData = [], isLoading: statusLoading } = useOrderStatus()

  const isLoading = statsLoading || revenueLoading || productsLoading || statusLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 bg-card border border-destructive/20">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-center text-muted-foreground">
            Erreur lors du chargement des données
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre activité NessyCrea</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 card-hover bg-card border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Messages</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalMessages || 0}</p>
              {stats && stats.unreadMessages > 0 && (
                <Badge variant="destructive" className="mt-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.unreadMessages} non lus
                </Badge>
              )}
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 card-hover bg-card border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.revenue || 0)}</p>
              <p className="text-xs text-muted-foreground mt-2">{stats?.totalOrders || 0} commandes</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Euro className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 card-hover bg-card border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taux de conversion</p>
              <p className="text-3xl font-bold text-foreground">{stats?.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">DM → Vente</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 card-hover bg-card border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Note moyenne</p>
              <p className="text-3xl font-bold text-foreground">{stats?.avgRating.toFixed(1)}/5</p>
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(stats?.avgRating || 0) ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Star className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6 card-hover bg-card border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Évolution du CA (30 derniers jours)</h3>
          {revenueData.length > 0 ? (
            <AreaChart
              className="h-72"
              data={revenueData}
              index="date"
              categories={['Chiffre d\'affaires']}
              colors={['pink']}
              valueFormatter={(value) => formatCurrency(value)}
              yAxisWidth={60}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              Aucune donnée de vente
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card className="p-6 card-hover bg-card border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Produits les plus vendus</h3>
          {productData.length > 0 ? (
            <BarChart
              className="h-72"
              data={productData}
              index="name"
              categories={['Ventes']}
              colors={['pink']}
              valueFormatter={(value) => `${value} ventes`}
              yAxisWidth={48}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              Aucune donnée produit
            </div>
          )}
        </Card>
      </div>

      {/* Order Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <Card className="p-6 card-hover bg-card border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Statut des commandes</h3>
          {orderStatusData.length > 0 ? (
            <DonutChart
              className="h-64"
              data={orderStatusData}
              category="value"
              index="name"
              colors={['pink', 'slate', 'gray', 'neutral', 'stone', 'zinc', 'red']}
              valueFormatter={(value) => `${value} commandes`}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune commande
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 lg:col-span-2 card-hover bg-card border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Activité récente</h3>
          <RecentActivity />
        </Card>
      </div>
    </div>
  )
}

function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg animate-pulse">
            <div className="h-5 w-5 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Aucune activité récente</p>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">@{activity.contacts?.username}</span>
                {' '}
                {activity.direction === 'inbound' ? 'a envoyé' : 'a reçu'}
                {' '}
                un message
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {activity.message_text}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(activity.received_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <Badge variant={
              activity.status === 'unread' ? 'destructive' :
              activity.status === 'responded' ? 'default' :
              'secondary'
            }>
              {activity.status}
            </Badge>
          </div>
        ))
      )}
    </div>
  )
}
