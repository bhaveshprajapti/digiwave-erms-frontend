"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimeClockProps {
  value?: string // HH:MM or HH:MM:SS (24h)
  onChange?: (value: string) => void
  withSeconds?: boolean
  className?: string
}

function parse(value?: string) {
  if (!value) return { h: 12, m: 0, s: 0, am: true }
  const [hh = 0, mm = 0, ss = 0] = value.split(":").map(Number)
  const am = hh < 12
  const h12 = ((hh + 11) % 12) + 1
  return { h: h12, m: mm, s: ss, am }
}

function to24({ h, m, s, am }: { h: number; m: number; s: number; am: boolean }, withSeconds: boolean) {
  const hh = (am ? (h % 12) : (h % 12) + 12).toString().padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return withSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`
}

function format12(h: number, m: number, s: number, am: boolean, withSeconds: boolean) {
  const labelH = String(h).padStart(2, '0')
  const labelM = String(m).padStart(2, '0')
  const labelS = String(s).padStart(2, '0')
  return withSeconds ? `${labelH}:${labelM}:${labelS} ${am ? 'AM' : 'PM'}` : `${labelH}:${labelM} ${am ? 'AM' : 'PM'}`
}

export function TimeClock({ value, onChange, withSeconds = true, className }: TimeClockProps) {
  const [open, setOpen] = React.useState(false)
  const init = React.useMemo(() => parse(value), [value])
  const [h, setH] = React.useState(init.h)
  const [m, setM] = React.useState(init.m)
  const [s, setS] = React.useState(init.s)
  const [am, setAm] = React.useState(init.am)

  React.useEffect(() => {
    const p = parse(value)
    setH(p.h); setM(p.m); setS(p.s); setAm(p.am)
  }, [value])

  const commit = (next?: Partial<{h:number;m:number;s:number;am:boolean}>) => {
    const payload = {
      h: next?.h ?? h,
      m: next?.m ?? m,
      s: next?.s ?? s,
      am: next?.am ?? am,
    }
    onChange?.(to24(payload, withSeconds))
  }

  const apply = () => {
    commit()
    setOpen(false)
  }

  const display = format12(h, m, s, am, withSeconds)

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) commit()
      }}
    >
      <PopoverTrigger asChild>
        <Input readOnly value={display} className={className} />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="start">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <div className="mb-2 text-sm font-medium">Hours</div>
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(v => (
                <button
                  key={v}
                  type="button"
                  className={cn('h-8 rounded-md border text-sm', v===h ? 'bg-primary text-primary-foreground' : 'bg-background')}
                  onClick={() => { setH(v); commit({ h: v }) }}
                >{v}</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" className={cn('h-8 flex-1 rounded-md border text-sm', am ? 'bg-primary text-primary-foreground' : '')} onClick={() => { setAm(true); commit({ am: true }) }}>AM</button>
              <button type="button" className={cn('h-8 flex-1 rounded-md border text-sm', !am ? 'bg-primary text-primary-foreground' : '')} onClick={() => { setAm(false); commit({ am: false }) }}>PM</button>
            </div>
          </div>
          <div className="col-span-1">
            <div className="mb-2 text-sm font-medium">Minutes</div>
            <div className="grid grid-cols-3 gap-1">
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(v => (
                <button
                  key={v}
                  type="button"
                  className={cn('h-8 rounded-md border text-sm', v===m ? 'bg-primary text-primary-foreground' : 'bg-background')}
                  onClick={() => { setM(v); commit({ m: v }) }}
                >{String(v).padStart(2,'0')}</button>
              ))}
            </div>
            <div className="mt-2">
              <input type="range" min={0} max={59} value={m} onChange={(e)=>{ const v = parseInt(e.target.value); setM(v); commit({ m: v }) }} className="w-full" />
            </div>
          </div>
          {withSeconds && (
            <div className="col-span-1">
              <div className="mb-2 text-sm font-medium">Seconds</div>
              <div className="grid grid-cols-3 gap-1">
                {[0,15,30,45].map(v => (
                  <button
                    key={v}
                    type="button"
                    className={cn('h-8 rounded-md border text-sm', v===s ? 'bg-primary text-primary-foreground' : 'bg-background')}
                    onClick={() => { setS(v); commit({ s: v }) }}
                  >{String(v).padStart(2,'0')}</button>
                ))}
              </div>
              <div className="mt-2">
                <input type="range" min={0} max={59} value={s} onChange={(e)=>{ const v = parseInt(e.target.value); setS(v); commit({ s: v }) }} className="w-full" />
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={apply} className="h-9 rounded-md border px-3 text-sm">Done</button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
