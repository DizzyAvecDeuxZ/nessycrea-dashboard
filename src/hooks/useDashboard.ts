import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DailySales, Activity, Review, OrderItem } from '@/lib/supabase'

export interface DashboardStats {
  totalMessages: number
  unreadMessages: number
  totalOrders: number
  revenue: number
  conversionRate: number
  avgResponseTime: number
  avgRating: number
}

export interface RevenueData {
  date: string
  'Chiffre d\'affaires': number
}

export interface ProductData {
  name: string
  'Ventes': number
}

export interface OrderStatusData {
  name: string
  value: number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [messagesResult, unreadResult, ordersResult, funnelResult, reviewsResult] = await Promise.all([
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'inbound'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'unread').eq('requires_response', true),
    supabase.from('orders').select('total_amount, status', { count: 'exact' }).in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase.from('conversion_funnel').select('conversion_rate').single(),
    supabase.from('reviews').select('rating')
  ])

  const revenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const avgRating = reviewsResult.data && reviewsResult.data.length > 0
    ? reviewsResult.data.reduce((sum, r) => sum + r.rating, 0) / reviewsResult.data.length
    : 0

  return {
    totalMessages: messagesResult.count || 0,
    unreadMessages: unreadResult.count || 0,
    totalOrders: ordersResult.count || 0,
    revenue,
    conversionRate: funnelResult.data?.conversion_rate || 0,
    avgResponseTime: 0,
    avgRating
  }
}

async function fetchRevenueData(): Promise<RevenueData[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await supabase
    .from('daily_sales')
    .select('sale_date, total_revenue')
    .gte('sale_date', thirtyDaysAgo.toISOString())
    .order('sale_date', { ascending: true })

  if (!data) return []

  return data.map(d => ({
    date: new Date(d.sale_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    'Chiffre d\'affaires': Number(d.total_revenue)
  }))
}

async function fetchTopProducts(): Promise<ProductData[]> {
  const { data: orders } = await supabase
    .from('orders')
    .select('items')
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  if (!orders) return []

  const productCounts: Record<string, number> = {}
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      (order.items as OrderItem[]).forEach((item) => {
        const name = item.product_name || 'Produit'
        productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1)
      })
    }
  })

  return Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, 'Ventes': count }))
}

async function fetchOrderStatus(): Promise<OrderStatusData[]> {
  const { data } = await supabase.from('orders').select('status')

  if (!data) return []

  const statusCounts: Record<string, number> = {}
  data.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
  })

  const statusLabels: Record<string, string> = {
    paid: 'Payées',
    processing: 'En cours',
    shipped: 'Expédiées',
    delivered: 'Livrées',
    pending: 'En attente',
    pending_payment: 'Paiement en attente',
    draft: 'Brouillons',
    cancelled: 'Annulées',
  }

  return Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count
  }))
}

async function fetchRecentActivity(): Promise<Activity[]> {
  const { data } = await supabase
    .from('messages')
    .select(`
      id,
      message_text,
      direction,
      status,
      received_at,
      contacts (username)
    `)
    .order('received_at', { ascending: false })
    .limit(5)

  return (data as unknown as Activity[]) || []
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useRevenueData() {
  return useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: fetchRevenueData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: fetchTopProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useOrderStatus() {
  return useQuery({
    queryKey: ['dashboard', 'orderStatus'],
    queryFn: fetchOrderStatus,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: fetchRecentActivity,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
