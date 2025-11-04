'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  MessageSquare,
  ShoppingBag,
  Star,
  UserPlus
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

interface Contact {
  id: string
  username: string
  full_name?: string
  email?: string
  phone?: string
  instagram_id?: string
  customer_type?: string
  tags?: string[]
  notes?: string
  created_at: string
  last_contact_at?: string
  total_orders?: number
  total_spent?: number
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    filterContacts()
  }, [contacts, searchQuery, typeFilter])

  async function fetchContacts() {
    try {
      // Fetch contacts with aggregated order data
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch order statistics for each contact
      const contactsWithStats = await Promise.all(
        (contactsData || []).map(async (contact) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('contact_id', contact.id)
            .in('status', ['paid', 'processing', 'shipped', 'delivered'])

          const totalOrders = orders?.length || 0
          const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

          return {
            ...contact,
            total_orders: totalOrders,
            total_spent: totalSpent,
          }
        })
      )

      setContacts(contactsWithStats)
      setFilteredContacts(contactsWithStats)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterContacts() {
    let filtered = [...contacts]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (contact) =>
          contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((contact) => contact.customer_type === typeFilter)
    }

    setFilteredContacts(filtered)
  }

  const stats = {
    total: contacts.length,
    leads: contacts.filter((c) => c.customer_type === 'lead').length,
    customers: contacts.filter((c) => c.customer_type === 'customer').length,
    vip: contacts.filter((c) => c.customer_type === 'vip').length,
  }

  function getCustomerTypeBadge(type?: string) {
    const typeConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      lead: { label: 'Lead', variant: 'outline' },
      customer: { label: 'Client', variant: 'default' },
      vip: { label: 'VIP', variant: 'secondary' },
    }

    const config = typeConfig[type || ''] || {
      label: type || 'Prospect',
      variant: 'outline' as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Gérez votre base de contacts</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total contacts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leads</p>
              <p className="text-2xl font-bold">{stats.leads}</p>
            </div>
            <UserPlus className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clients</p>
              <p className="text-2xl font-bold">{stats.customers}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">VIP</p>
              <p className="text-2xl font-bold">{stats.vip}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un contact..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type de contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="customer">Clients</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Contacts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Identifiant</TableHead>
              <TableHead className="w-[150px]">Nom complet</TableHead>
              <TableHead className="w-[200px]">Contact</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[100px]">Commandes</TableHead>
              <TableHead className="w-[120px]">Total dépensé</TableHead>
              <TableHead className="w-[150px]">Inscrit le</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun contact trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    @{contact.username}
                  </TableCell>
                  <TableCell>
                    {contact.full_name || (
                      <span className="text-muted-foreground italic">Non renseigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.phone}
                        </div>
                      )}
                      {!contact.email && !contact.phone && (
                        <span className="text-muted-foreground italic text-sm">
                          Pas de contact
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCustomerTypeBadge(contact.customer_type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 mr-1 text-muted-foreground" />
                      {contact.total_orders || 0}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {contact.total_spent
                      ? formatCurrency(contact.total_spent)
                      : formatCurrency(0)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Voir les messages
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Voir les commandes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Modifier le contact</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer le contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Affichage de {filteredContacts.length} contact(s) sur {contacts.length}
      </div>
    </div>
  )
}
