'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MessageSquare,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Send,
  Inbox
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

interface Message {
  id: string
  message_text: string
  direction: 'inbound' | 'outbound'
  status: string
  received_at: string
  sentiment?: string
  requires_response: boolean
  contacts: {
    username: string
    full_name?: string
  } | null
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    filterMessages()
  }, [messages, searchQuery, statusFilter, directionFilter])

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          message_text,
          direction,
          status,
          received_at,
          sentiment,
          requires_response,
          contacts (
            username,
            full_name
          )
        `)
        .order('received_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Transform data to match Message interface
      const transformedData = (data || []).map(msg => ({
        ...msg,
        contacts: Array.isArray(msg.contacts) ? msg.contacts[0] : msg.contacts
      }))

      setMessages(transformedData as Message[])
      setFilteredMessages(transformedData as Message[])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterMessages() {
    let filtered = [...messages]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.message_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.contacts?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.contacts?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((msg) => msg.status === statusFilter)
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter((msg) => msg.direction === directionFilter)
    }

    setFilteredMessages(filtered)
  }

  async function updateMessageStatus(messageId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: newStatus })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      setMessages(
        messages.map((msg) =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        )
      )
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const statusCounts = {
    all: messages.length,
    unread: messages.filter((m) => m.status === 'unread').length,
    read: messages.filter((m) => m.status === 'read').length,
    responded: messages.filter((m) => m.status === 'responded').length,
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Gérez vos conversations Instagram</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{statusCounts.all}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Non lus</p>
              <p className="text-2xl font-bold">{statusCounts.unread}</p>
            </div>
            <Circle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lus</p>
              <p className="text-2xl font-bold">{statusCounts.read}</p>
            </div>
            <Inbox className="h-8 w-8 text-gray-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Répondus</p>
              <p className="text-2xl font-bold">{statusCounts.responded}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
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
                placeholder="Rechercher un contact ou un message..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="unread">Non lus</SelectItem>
              <SelectItem value="read">Lus</SelectItem>
              <SelectItem value="responded">Répondus</SelectItem>
            </SelectContent>
          </Select>

          {/* Direction Filter */}
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes directions</SelectItem>
              <SelectItem value="inbound">Reçus</SelectItem>
              <SelectItem value="outbound">Envoyés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Messages Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Contact</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[100px]">Direction</TableHead>
              <TableHead className="w-[120px]">Statut</TableHead>
              <TableHead className="w-[100px]">Sentiment</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun message trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">@{message.contacts?.username}</p>
                      {message.contacts?.full_name && (
                        <p className="text-xs text-muted-foreground">
                          {message.contacts.full_name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="truncate max-w-[400px]">{message.message_text}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={message.direction === 'inbound' ? 'default' : 'secondary'}>
                      {message.direction === 'inbound' ? (
                        <>
                          <Inbox className="h-3 w-3 mr-1" />
                          Reçu
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          Envoyé
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        message.status === 'unread'
                          ? 'destructive'
                          : message.status === 'responded'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {message.status === 'unread'
                        ? 'Non lu'
                        : message.status === 'read'
                        ? 'Lu'
                        : 'Répondu'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {message.sentiment && (
                      <Badge
                        variant="outline"
                        className={
                          message.sentiment === 'positive'
                            ? 'text-green-600 border-green-600'
                            : message.sentiment === 'negative'
                            ? 'text-red-600 border-red-600'
                            : 'text-gray-600 border-gray-600'
                        }
                      >
                        {message.sentiment === 'positive'
                          ? 'Positif'
                          : message.sentiment === 'negative'
                          ? 'Négatif'
                          : 'Neutre'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(message.received_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
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
                        <DropdownMenuItem
                          onClick={() => updateMessageStatus(message.id, 'read')}
                        >
                          Marquer comme lu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateMessageStatus(message.id, 'unread')}
                        >
                          Marquer comme non lu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateMessageStatus(message.id, 'responded')}
                        >
                          Marquer comme répondu
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Voir la conversation</DropdownMenuItem>
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
        Affichage de {filteredMessages.length} message(s) sur {messages.length}
      </div>
    </div>
  )
}
