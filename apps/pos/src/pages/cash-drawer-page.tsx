"use client"

import { useState } from "react"
import { usePosStore } from "@/store/store"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/ui/dialog"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Badge } from "@repo/ui/components/ui/badge"
import { DollarSign, ArrowUp, ArrowDown, Lock, Unlock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { useCashDrawer } from "@/hooks/use-cash-drawer"
import { DoorOpen, RefreshCcw } from "lucide-react"
import posthog from 'posthog-js';

export default function CashDrawerPage() {
  const settings = usePosStore((state) => state.settings)
  const cashDrawers = usePosStore((state) => state.cashDrawers)
  const activeCashDrawerId = usePosStore((state) => state.activeCashDrawerId)
  const openCashDrawer = usePosStore((state) => state.openCashDrawer)
  const closeCashDrawer = usePosStore((state) => state.closeCashDrawer)
  const addCashTransaction = usePosStore((state) => state.addCashTransaction)

  const { openPhysicalDrawer, isOpening } = useCashDrawer()

  const [isOpenDrawerDialogOpen, setIsOpenDrawerDialogOpen] = useState(false)
  const [isCloseDrawerDialogOpen, setIsCloseDrawerDialogOpen] = useState(false)
  const [isCashInDialogOpen, setIsCashInDialogOpen] = useState(false)
  const [isCashOutDialogOpen, setIsCashOutDialogOpen] = useState(false)

  const [openingBalance, setOpeningBalance] = useState("")
  const [closingBalance, setClosingBalance] = useState("")
  const [cashAmount, setCashAmount] = useState("")
  const [cashNotes, setCashNotes] = useState("")

  const activeDrawer = cashDrawers.find((d) => d.id === activeCashDrawerId)
  const closedDrawers = cashDrawers
    .filter((d) => d.status === "closed")
    .sort((a, b) => new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleOpenDrawer = () => {
    const amount = Number.parseFloat(openingBalance)
    if (!isNaN(amount) && amount >= 0) {
      openCashDrawer(amount)
      posthog.capture("cash_drawer_opened", { opening_balance: amount });
      setOpeningBalance("")
      setIsOpenDrawerDialogOpen(false)
    }
  }

  const handleCloseDrawer = () => {
    const amount = Number.parseFloat(closingBalance)
    if (!isNaN(amount) && amount >= 0) {
      // const stats = getDrawerStats(activeDrawer);
      closeCashDrawer(amount);
      // trackEvent("cash_drawer_closed", { 
      //   closing_balance: amount, 
      //   expected_balance: stats.expected,
      //   difference: amount - stats.expected
      // });
      setClosingBalance("")
      setIsCloseDrawerDialogOpen(false)
    }
  }

  const handleCashIn = () => {
    const amount = Number.parseFloat(cashAmount)
    if (!isNaN(amount) && amount > 0) {
      addCashTransaction("cash-in", amount, cashNotes)
      posthog.capture("cash_in_out", { type: "cash-in", amount });
      setCashAmount("")
      setCashNotes("")
      setIsCashInDialogOpen(false)
    }
  }

  const handleCashOut = () => {
    const amount = Number.parseFloat(cashAmount)
    if (!isNaN(amount) && amount > 0) {
      addCashTransaction("cash-out", amount, cashNotes)
      posthog.capture("cash_in_out", { type: "cash-out", amount });
      setCashAmount("")
      setCashNotes("")
      setIsCashOutDialogOpen(false)
    }
  }

  const getDrawerStats = (drawer: typeof activeDrawer) => {
    if (!drawer) return { sales: 0, cashIn: 0, cashOut: 0, refunds: 0, expected: 0 }

    const sales = drawer.transactions.filter((t) => t.type === "sale").reduce((sum, t) => sum + t.amount, 0)
    const cashIn = drawer.transactions.filter((t) => t.type === "cash-in").reduce((sum, t) => sum + t.amount, 0)
    const cashOut = drawer.transactions.filter((t) => t.type === "cash-out").reduce((sum, t) => sum + t.amount, 0)
    const refunds = drawer.transactions.filter((t) => t.type === "refund").reduce((sum, t) => sum + t.amount, 0)
    const expected = drawer.openingBalance + sales + cashIn - cashOut - refunds

    return { sales, cashIn, cashOut, refunds, expected }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Drawer Management</h1>
          <p className="text-muted-foreground mt-1">Track cash flow and drawer sessions</p>
        </div>

        {!activeDrawer ? (
          <Dialog open={isOpenDrawerDialogOpen} onOpenChange={setIsOpenDrawerDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Unlock className="w-4 h-4 mr-2" />
                Open Cash Drawer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Open Cash Drawer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opening-balance">Opening Balance</Label>
                  <Input
                    id="opening-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpenDrawerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleOpenDrawer}>Open Drawer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={isCloseDrawerDialogOpen} onOpenChange={setIsCloseDrawerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Lock className="w-4 h-4 mr-2" />
                Close Cash Drawer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Close Cash Drawer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="closing-balance">Actual Cash Count</Label>
                  <Input
                    id="closing-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Expected: {formatCurrency(getDrawerStats(activeDrawer).expected)}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCloseDrawerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleCloseDrawer}>
                    Close Drawer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Session</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {!activeDrawer ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Active Cash Drawer</p>
                <p className="text-muted-foreground mb-4">Open a cash drawer to start processing transactions</p>
                <Button onClick={() => setIsOpenDrawerDialogOpen(true)}>
                  <Unlock className="w-4 h-4 mr-2" />
                  Open Cash Drawer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(activeDrawer.openingBalance)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      +{formatCurrency(getDrawerStats(activeDrawer).sales)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash In</CardTitle>
                    <ArrowUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      +{formatCurrency(getDrawerStats(activeDrawer).cashIn)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash Out</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      -{formatCurrency(getDrawerStats(activeDrawer).cashOut)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Session</CardTitle>
                      <CardDescription>
                        Opened by {activeDrawer.employeeName} at {new Date(activeDrawer.openedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openPhysicalDrawer()}
                        disabled={isOpening}
                      >
                         {isOpening ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <DoorOpen className="w-4 h-4 mr-2" />}
                         Open Drawer
                      </Button>
                      <Dialog open={isCashInDialogOpen} onOpenChange={setIsCashInDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ArrowUp className="w-4 h-4 mr-2" />
                            Cash In
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Cash In</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="cash-in-amount">Amount</Label>
                              <Input
                                id="cash-in-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cash-in-notes">Notes</Label>
                              <Textarea
                                id="cash-in-notes"
                                value={cashNotes}
                                onChange={(e) => setCashNotes(e.target.value)}
                                placeholder="Reason for cash in..."
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setIsCashInDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleCashIn}>Add Cash In</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isCashOutDialogOpen} onOpenChange={setIsCashOutDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ArrowDown className="w-4 h-4 mr-2" />
                            Cash Out
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Cash Out</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="cash-out-amount">Amount</Label>
                              <Input
                                id="cash-out-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cash-out-notes">Notes</Label>
                              <Textarea
                                id="cash-out-notes"
                                value={cashNotes}
                                onChange={(e) => setCashNotes(e.target.value)}
                                placeholder="Reason for cash out..."
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setIsCashOutDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleCashOut}>
                                Remove Cash Out
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeDrawer.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
                    ) : (
                      activeDrawer.transactions
                        .slice()
                        .reverse()
                        .map((transaction, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              {transaction.type === "sale" || transaction.type === "cash-in" ? (
                                <ArrowUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowDown className="w-4 h-4 text-red-600" />
                              )}
                              <div>
                                <div className="font-medium capitalize">{transaction.type.replace("-", " ")}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(transaction.timestamp).toLocaleTimeString()}
                                  {transaction.notes && ` - ${transaction.notes}`}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`font-semibold ${
                                transaction.type === "sale" || transaction.type === "cash-in"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "sale" || transaction.type === "cash-in" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Expected Balance</span>
                      <span>{formatCurrency(getDrawerStats(activeDrawer).expected)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {closedDrawers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No closed drawer sessions yet</p>
              </CardContent>
            </Card>
          ) : (
            closedDrawers.map((drawer) => {
              const stats = getDrawerStats(drawer)
              return (
                <Card key={drawer.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{drawer.employeeName}</CardTitle>
                        <CardDescription>
                          {new Date(drawer.openedAt).toLocaleDateString()} •{" "}
                          {new Date(drawer.openedAt).toLocaleTimeString()} -{" "}
                          {drawer.closedAt && new Date(drawer.closedAt).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          drawer.difference === 0 ? "secondary" : drawer.difference! > 0 ? "default" : "destructive"
                        }
                      >
                        {drawer.difference === 0 ? "Balanced" : drawer.difference! > 0 ? "Overage" : "Shortage"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Opening</div>
                        <div className="text-lg font-semibold">{formatCurrency(drawer.openingBalance)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Sales</div>
                        <div className="text-lg font-semibold text-green-600">+{formatCurrency(stats.sales)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Expected</div>
                        <div className="text-lg font-semibold">{formatCurrency(drawer.expectedBalance || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Actual</div>
                        <div className="text-lg font-semibold">{formatCurrency(drawer.closingBalance || 0)}</div>
                      </div>
                    </div>
                    {drawer.difference !== 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Difference</span>
                          <span
                            className={`text-sm font-bold ${drawer.difference! > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {drawer.difference! > 0 ? "+" : ""}
                            {formatCurrency(drawer.difference || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
