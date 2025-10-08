"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getLeaveBalances, updateLeaveBalance } from "@/lib/api/leave-balances"

export default function LeaveBalancesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getLeaveBalances()
      setRows(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onUpdate = async (id: number, field: string, value: string) => {
    await updateLeaveBalance(id, { [field]: value })
    load()
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Balances</h2>
        <p className="text-sm text-muted-foreground md:text-base">View and edit user leave balances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Carried</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.user}</TableCell>
                    <TableCell>{r.leave_type}</TableCell>
                    <TableCell>{r.year}</TableCell>
                    <TableCell>
                      <Input defaultValue={r.opening_balance} onBlur={(e) => onUpdate(r.id, 'opening_balance', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input defaultValue={r.used} onBlur={(e) => onUpdate(r.id, 'used', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input defaultValue={r.carried_forward} onBlur={(e) => onUpdate(r.id, 'carried_forward', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => load()}>Refresh</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
