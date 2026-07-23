"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Wallet,
  ArrowUpRight,
  History,
  MapPin,
  User,
  MoreVertical,
  Search,
  DollarSign,
  Loader2,
  Building2,
  ListFilter,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@repo/ui/components/ui/table";
import { toast } from "sonner";
import {
  createPettyCashFund,
  topUpPettyCashFund,
  getPettyCashTransactions,
} from "@/app/actions/petty-cash";
import { cn } from "@repo/ui/lib/utils";

export function PettyCashClient({
  initialFunds,
  initialTransactions = [],
  staff,
  locations,
}: {
  initialFunds: any[];
  initialTransactions?: any[];
  staff: any[];
  locations: any[];
}) {
  const [funds, setFunds] = useState(initialFunds);
  const [allTransactions, setAllTransactions] = useState(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Create Fund Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    name: "",
    floatAmount: 0,
    currencyCode: "KES",
    responsibleMemberId: "",
    locationId: "",
  });

  // Top Up Dialog State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [topUpData, setTopUpData] = useState({
    amount: 0,
    description: "",
  });

  // Transactions Dialog State (For single fund view)
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const handleCreateFund = async () => {
    if (!createData.name || !createData.responsibleMemberId || createData.floatAmount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const newFund = await createPettyCashFund(createData);
        setFunds([newFund, ...funds]);
        toast.success("Petty cash fund created");
        setIsCreateOpen(false);
        setCreateData({
          name: "",
          floatAmount: 0,
          currencyCode: "KES",
          responsibleMemberId: "",
          locationId: "",
        });
      } catch (error) {
        toast.error("Failed to create fund");
      }
    });
  };

  const handleTopUp = async () => {
    if (topUpData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    startTransition(async () => {
      try {
        const updatedFund = await topUpPettyCashFund(selectedFund.id, topUpData);
        setFunds(funds.map(f => (f.id === updatedFund.id ? { ...f, amount: updatedFund.amount } : f)));

        // Append to allTransactions state locally for real-time update in all transactions tab
        const newTx = {
          id: `local-topup-${Date.now()}`,
          fundId: selectedFund.id,
          type: "TOP_UP",
          amount: topUpData.amount,
          description: topUpData.description || "Fund top-up",
          createdAt: new Date().toISOString(),
          fund: selectedFund,
          member: {
            user: {
              name: "Current User",
            },
          },
        };
        setAllTransactions([newTx, ...allTransactions]);

        toast.success("Fund topped up successfully");
        setIsTopUpOpen(false);
        setTopUpData({ amount: 0, description: "" });
      } catch (error) {
        toast.error("Failed to top up fund");
      }
    });
  };

  const viewTransactions = async (fund: any) => {
    setSelectedFund(fund);
    setIsTransactionsOpen(true);
    setIsLoadingTransactions(true);
    try {
      const data = await getPettyCashTransactions(fund.id);
      setTransactions(data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Filters for Funds Overview
  const filteredFunds = funds.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filters for All Transactions Tab
  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fund?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fund?.location?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.member?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch =
      selectedBranchFilter === "all" ||
      tx.fund?.locationId === selectedBranchFilter;

    const matchesType =
      selectedTypeFilter === "all" ||
      tx.type === selectedTypeFilter;

    return matchesSearch && matchesBranch && matchesType;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="funds" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-3 mb-6">
          <TabsList className="bg-zinc-100 p-1 rounded-xl w-fit flex gap-1">
            <TabsTrigger value="funds" className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
              Funds Overview ({filteredFunds.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
              All Expenses & Transactions ({filteredTransactions.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#34A853] hover:bg-[#2d9147]"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Fund
          </Button>
        </div>

        {/* TAB 1: FUNDS OVERVIEW */}
        <TabsContent value="funds" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search funds by name or location..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFunds.map(fund => (
              <div
                key={fund.id}
                className="bg-white p-6 rounded-2xl border border-zinc-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-zinc-100 text-zinc-600 group-hover:bg-[#34A853]/10 group-hover:text-[#34A853] transition-colors">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4 text-zinc-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedFund(fund); setIsTopUpOpen(true); }}>
                        Top Up Fund
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => viewTransactions(fund)}>
                        View Transactions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-bold text-zinc-900">{fund.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {fund.location?.name || "Global / Main Office"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-4 mb-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Current Balance</p>
                      <p className="text-2xl font-bold text-zinc-900">
                        {fund.currencyCode} {Number(fund.amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-white border-zinc-200">
                      Float: {Number(fund.floatAmount || 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        (Number(fund.amount || 0) / Number(fund.floatAmount || 1)) < 0.2 ? "bg-red-500" : "bg-[#34A853]"
                      )}
                      style={{ width: `${Math.min(100, (Number(fund.amount || 0) / Number(fund.floatAmount || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-medium">{fund.responsibleMember?.user?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[#34A853] hover:text-[#2d9147] hover:bg-[#34A853]/5 font-bold px-0"
                    onClick={() => viewTransactions(fund)}
                  >
                    View History <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: ALL TRANSACTIONS (ORGANISATION & BRANCH VIEW) */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200">
            <div className="flex flex-col sm:flex-row flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search description, staff, fund, location..."
                  className="pl-9 h-11"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-56">
                <Select
                  value={selectedBranchFilter}
                  onValueChange={setSelectedBranchFilter}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches / Locations</SelectItem>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-48">
                <Select
                  value={selectedTypeFilter}
                  onValueChange={setSelectedTypeFilter}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="EXPENSE">Expenses</SelectItem>
                    <SelectItem value="TOP_UP">Top Ups / Float</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 border-b border-zinc-200">
                <TableRow>
                  <TableHead className="font-bold py-4 pl-6">Transaction / Description</TableHead>
                  <TableHead className="font-bold">Fund / Branch</TableHead>
                  <TableHead className="font-bold">Staff Member</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold text-right pr-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-zinc-500 font-medium">
                      No matching transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(tx => (
                    <TableRow key={tx.id} className="hover:bg-zinc-50/50">
                      <TableCell className="py-4 pl-6">
                        <div className="font-bold text-zinc-900">{tx.description || tx.type}</div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-zinc-800">{tx.fund?.name || "Global Fund"}</div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          {tx.fund?.location?.name || "Global / Main Office"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-zinc-700">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-medium">{tx.member?.user?.name || "System"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold text-xs px-2.5 py-1 rounded-full",
                            tx.type === "TOP_UP"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          )}
                        >
                          {tx.type === "TOP_UP" ? "Top Up" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-bold text-sm">
                        <span
                          className={tx.type === "TOP_UP" ? "text-emerald-600" : "text-rose-600"}
                        >
                          {tx.type === "TOP_UP" ? "+" : "-"}{tx.fund?.currencyCode || "KES"}{" "}
                          {Number(tx.amount || 0).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Fund Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Petty Cash Fund</DialogTitle>
            <DialogDescription>
              Set up a new petty cash fund for a specific location or person.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Fund Name</Label>
              <Input
                placeholder="e.g. Front Desk Petty Cash"
                value={createData.name}
                onChange={e => setCreateData({ ...createData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Float Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    type="number"
                    className="pl-9"
                    value={createData.floatAmount}
                    onChange={e => setCreateData({ ...createData, floatAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={createData.currencyCode}
                  onValueChange={val => setCreateData({ ...createData, currencyCode: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsible Member</Label>
              <Select
                value={createData.responsibleMemberId}
                onValueChange={val => setCreateData({ ...createData, responsibleMemberId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Select
                value={createData.locationId}
                onValueChange={val => setCreateData({ ...createData, locationId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#34A853] hover:bg-[#2d9147]"
              onClick={handleCreateFund}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Fund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Fund: {selectedFund?.name}</DialogTitle>
            <DialogDescription>Add money to the petty cash fund.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="number"
                  className="pl-9"
                  value={topUpData.amount}
                  onChange={e => setTopUpData({ ...topUpData, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Monthly replenishment"
                value={topUpData.description}
                onChange={e => setTopUpData({ ...topUpData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTopUpOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#34A853] hover:bg-[#2d9147]"
              onClick={handleTopUp}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Top Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Transaction History: {selectedFund?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#34A853]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No transactions found for this fund.
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tx.type === "TOP_UP" ? "bg-green-100 text-green-600" :
                        tx.type === "EXPENSE" ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {tx.type === "TOP_UP" ? <Plus className="w-4 h-4" /> : <History className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{tx.description || tx.type}</p>
                        <p className="text-[11px] text-zinc-400">
                          {new Date(tx.createdAt).toLocaleString()} • {tx.member?.user?.name}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-sm font-bold",
                      tx.type === "TOP_UP" ? "text-green-600" : "text-red-600"
                    )}>
                      {tx.type === "TOP_UP" ? "+" : "-"}{selectedFund?.currencyCode} {Number(tx.amount || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
