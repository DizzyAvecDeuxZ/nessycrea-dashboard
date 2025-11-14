'use client'

import {
  MessageSquare,
  AlertCircle,
  Euro,
  TrendingUp,
  Star,
  ShoppingCart,
  Users,
  TrendingDown,
  Info
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AreaChart, BarChart, DonutChart } from '@tremor/react'
import { formatCurrency } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ActivityTimeline } from '@/components/advanced'
import { NumberTicker, FadeInText } from '@/components/magic'
import OrderStatusChart from '@/components/charts/OrderStatusChart'
import RevenueChart from '@/components/charts/RevenueChart'
import TopProductsCarousel from '@/components/charts/TopProductsCarousel'
import {
  useDashboardStats,
  useRevenueData,
  useTopProducts,
  useOrderStatus,
  useRecentActivity,
  useRatingDistribution
} from '@/hooks/useDashboard'
import type { Activity } from '@/lib/supabase'

interface KPICardProps {
  title: string
  value: string | number | React.ReactNode
  icon: React.ReactNode
  badge?: React.ReactNode
  subtitle?: string | React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  progress?: number
  info?: string
  variant?: 'pink' | 'gold' | 'mint' | 'rose'
}

// Styles des variants - définis en dehors du composant pour éviter les recréations
const VARIANT_STYLES = {
  pink: {
    gradient: 'from-[#E8C4D8]/20 via-[#E8C4D8]/10 to-transparent',
    border: 'border-[#E8C4D8]/30',
    value: 'text-[#E8C4D8]',
    icon: 'text-[#E8C4D8]',
    iconBg: 'bg-[#E8C4D8]/10',
    iconBorder: 'border-[#E8C4D8]/20',
    glow: 'shadow-[0_0_20px_rgba(232,196,216,0.3)]',
    progressBg: 'bg-[#E8C4D8]/20',
    progressFill: 'bg-[#E8C4D8]'
  },
  gold: {
    gradient: 'from-[#FFE5B4]/20 via-[#FFF5E6]/10 to-transparent',
    border: 'border-[#FFD700]/30',
    value: 'text-[#FFD700]',
    icon: 'text-[#FFD700]',
    iconBg: 'bg-[#FFD700]/10',
    iconBorder: 'border-[#FFD700]/20',
    glow: 'shadow-[0_0_20px_rgba(255,215,0,0.3)]',
    progressBg: 'bg-[#FFD700]/20',
    progressFill: 'bg-[#FFD700]'
  },
  mint: {
    gradient: 'from-[#A8D5BA]/20 via-[#A8D5BA]/10 to-transparent',
    border: 'border-[#A8D5BA]/30',
    value: 'text-[#A8D5BA]',
    icon: 'text-[#A8D5BA]',
    iconBg: 'bg-[#A8D5BA]/10',
    iconBorder: 'border-[#A8D5BA]/20',
    glow: 'shadow-[0_0_20px_rgba(168,213,186,0.3)]',
    progressBg: 'bg-[#A8D5BA]/20',
    progressFill: 'bg-[#A8D5BA]'
  },
  rose: {
    gradient: 'from-[#FFB6C1]/20 via-[#FFC0CB]/10 to-transparent',
    border: 'border-[#FFB6C1]/30',
    value: 'text-[#FFB6C1]',
    icon: 'text-[#FFB6C1]',
    iconBg: 'bg-[#FFB6C1]/10',
    iconBorder: 'border-[#FFB6C1]/20',
    glow: 'shadow-[0_0_20px_rgba(255,182,193,0.3)]',
    progressBg: 'bg-[#FFB6C1]/20',
    progressFill: 'bg-[#FFB6C1]'
  }
} as const

function KPICard({ title, value, icon, badge, subtitle, trend, progress, info, variant = 'pink' }: KPICardProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <Card className={`p-6 card-hover bg-gradient-to-br ${styles.gradient} border ${styles.border} group relative overflow-hidden`}>
      {/* Glow effect on hover - optimisé */}
      <div className={`absolute inset-0 ${styles.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none`} />

      <div className="relative flex items-center justify-between z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <p className={`text-2xl sm:text-3xl font-bold ${styles.value} mb-2 transition-colors duration-300`}>
            {typeof value === 'number' ? (
              <NumberTicker value={value} />
            ) : typeof value === 'string' ? (
              value
            ) : (
              value
            )}
          </p>

          {badge && <div className="mb-2">{badge}</div>}

          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {typeof subtitle === 'string' ? subtitle : subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value}%
              </span>
            </div>
          )}

          {progress !== undefined && (
            <div className="mt-3">
              <div className={`h-1.5 w-full rounded-full ${styles.progressBg} overflow-hidden`}>
                <div 
                  className={`h-full ${styles.progressFill} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{progress}% de l'objectif</p>
            </div>
          )}
        </div>

        <div className={`p-3 ${styles.iconBg} rounded-2xl border ${styles.iconBorder} group-hover:scale-110 transition-transform duration-300`}>
          <div className={styles.icon}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: revenueData = [], isLoading: revenueLoading } = useRevenueData()
  const { data: productData = [], isLoading: productsLoading } = useTopProducts()
  const { data: orderStatusData = [], isLoading: statusLoading } = useOrderStatus()
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivity()
  const { data: ratingDistribution = [] } = useRatingDistribution()

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

  // Calculate revenue progress (example: objective 10000€)
  const revenueObjective = 10000
  const revenueProgress = Math.min((stats?.revenue || 0) / revenueObjective * 100, 100)

  // Calculate conversion rate trend (example: +15% vs last month)
  const conversionTrend = { value: 15, isPositive: true }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
          <FadeInText text="Dashboard" delay={0.1} />
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          <FadeInText text="Vue d'ensemble de votre activité NessyCrea" delay={0.2} />
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Messages"
          value={<NumberTicker value={stats?.totalMessages || 0} />}
          icon={<MessageSquare className="h-6 w-6" />}
          badge={
            stats && stats.unreadMessages > 0 ? (
              <Badge variant="destructive" className="animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                <NumberTicker value={stats.unreadMessages} /> non lus
              </Badge>
            ) : undefined
          }
          info="Nombre total de messages reçus dans votre messagerie Instagram"
          variant="pink"
        />

        <HoverCard>
          <HoverCardTrigger asChild>
            <div>
              <KPICard
                title="Chiffre d'affaires"
                value={<NumberTicker value={stats?.revenue || 0} formatCurrency decimals={0} />}
                icon={<Euro className="h-6 w-6" />}
                subtitle={<><NumberTicker value={stats?.totalOrders || 0} /> commandes</>}
                progress={revenueProgress}
                info="Chiffre d'affaires total généré ce mois-ci"
                variant="gold"
              />
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Détails du CA</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Objectif mensuel</p>
                  <p className="font-medium">{formatCurrency(revenueObjective)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Restant</p>
                  <p className="font-medium">{formatCurrency(Math.max(0, revenueObjective - (stats?.revenue || 0)))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Panier moyen</p>
                  <p className="font-medium">{formatCurrency((stats?.revenue || 0) / (stats?.totalOrders || 1))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Commandes</p>
                  <p className="font-medium">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        <KPICard
          title="Taux de conversion"
          value={<><NumberTicker value={stats?.conversionRate || 0} decimals={1} />%</>}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle="DM → Vente"
          trend={conversionTrend}
          info="Pourcentage de messages convertis en ventes"
          variant="mint"
        />

        <HoverCard>
          <HoverCardTrigger asChild>
            <div>
              <KPICard
                title="Note moyenne"
                value={<><NumberTicker value={stats?.avgRating || 0} decimals={1} />/5</>}
                icon={<Star className="h-6 w-6" />}
                badge={
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(stats?.avgRating || 0) ? 'text-[#FFB6C1] fill-[#FFB6C1]' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                }
                info="Note moyenne des avis clients"
                variant="rose"
              />
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Détails des avis</h4>
              <div className="space-y-2">
                {ratingDistribution.length > 0 ? (
                  ratingDistribution.map((dist) => (
                    <div key={dist.rating} className="flex items-center gap-2">
                      <span className="text-xs w-6">{dist.rating}★</span>
                      <Progress value={dist.percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {dist.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Additional Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 card-hover bg-gradient-to-br from-[#FFD700]/10 via-[#FFE5B4]/5 to-transparent border border-[#FFD700]/20 group relative overflow-hidden">
          <div className="absolute inset-0 shadow-[0_0_15px_rgba(255,215,0,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="p-2 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/20">
              <ShoppingCart className="h-5 w-5 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Panier moyen</p>
              <p className="text-lg font-semibold text-[#FFD700]">
                {formatCurrency((stats?.revenue || 0) / (stats?.totalOrders || 1))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 card-hover bg-gradient-to-br from-[#E8C4D8]/10 via-[#E8C4D8]/5 to-transparent border border-[#E8C4D8]/20 group relative overflow-hidden">
          <div className="absolute inset-0 shadow-[0_0_15px_rgba(232,196,216,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="p-2 bg-[#E8C4D8]/10 rounded-lg border border-[#E8C4D8]/20">
              <Users className="h-5 w-5 text-[#E8C4D8]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clients actifs</p>
              <p className="text-lg font-semibold text-[#E8C4D8]">{Math.floor((stats?.totalMessages || 0) / 3)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 card-hover bg-gradient-to-br from-[#A8D5BA]/10 via-[#A8D5BA]/5 to-transparent border border-[#A8D5BA]/20 group relative overflow-hidden">
          <div className="absolute inset-0 shadow-[0_0_15px_rgba(168,213,186,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="p-2 bg-[#A8D5BA]/10 rounded-lg border border-[#A8D5BA]/20">
              <TrendingUp className="h-5 w-5 text-[#A8D5BA]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Croissance</p>
              <p className="text-lg font-semibold text-[#A8D5BA]">+24%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 card-hover bg-gradient-to-br from-[#FFB6C1]/10 via-[#FFC0CB]/5 to-transparent border border-[#FFB6C1]/20 group relative overflow-hidden">
          <div className="absolute inset-0 shadow-[0_0_15px_rgba(255,182,193,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="p-2 bg-[#FFB6C1]/10 rounded-lg border border-[#FFB6C1]/20">
              <Star className="h-5 w-5 text-[#FFB6C1]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taux satisfaction</p>
              <p className="text-lg font-semibold text-[#FFB6C1]">
                {((stats?.avgRating || 0) / 5 * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Revenue Trend - New High-Contrast Chart */}
        <Card className="p-6 card-hover bg-card border border-white/10">
          {revenueData.length > 0 ? (
            <RevenueChart
              data={{
                day: revenueData.slice(-7).map((item, index) => ({
                  label: `Jour ${index + 1}`,
                  revenue: item['Chiffre d\'affaires'] || 0,
                })),
                week: revenueData.slice(-4).map((item, index) => ({
                  label: `S${index + 1}`,
                  revenue: item['Chiffre d\'affaires'] || 0,
                })),
                month: revenueData.map((item) => ({
                  label: item.date || '',
                  revenue: item['Chiffre d\'affaires'] || 0,
                })),
                year: revenueData.slice(-12).map((item, index) => ({
                  label: `M${index + 1}`,
                  revenue: item['Chiffre d\'affaires'] || 0,
                })),
              }}
              trend={15.3}
            />
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Évolution du CA</h3>
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                Aucune donnée de vente
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Top Products Carousel - New Visual Component */}
      <Card className="p-6 card-hover bg-card border border-white/10">
        {productData.length > 0 ? (
          <TopProductsCarousel
            products={productData.map((item: any, index: number) => ({
              id: `product-${index}`,
              name: item.name || 'Produit',
              image: '/placeholder-product.jpg',
              price: (stats?.revenue || 0) / (stats?.totalOrders || 1) * 0.8,
              sold: item.Ventes || 0,
              stock: Math.floor(Math.random() * 100) + 10,
              revenue: (item.Ventes || 0) * ((stats?.revenue || 0) / (stats?.totalOrders || 1) * 0.8),
            }))}
          />
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Produits les plus vendus</h3>
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              Aucune donnée produit
            </div>
          </>
        )}
      </Card>

      {/* Order Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution - New Horizontal Bar Chart */}
        <Card className="p-6 card-hover bg-card border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Statut des commandes</h3>
          {orderStatusData.length > 0 ? (
            <OrderStatusChart
              data={orderStatusData.map((item: any) => ({
                status: item.name || '',
                count: item.value || 0,
                percentage: 0, // Will be calculated in component
              }))}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune commande
            </div>
          )}
        </Card>

        {/* Recent Activity - Now using Timeline */}
        <Card className="p-6 lg:col-span-2 card-hover bg-card border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Activité récente</h3>
          {activitiesLoading ? (
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
          ) : (
            <ActivityTimeline activities={activities} />
          )}
        </Card>
      </div>
    </div>
  )
}
